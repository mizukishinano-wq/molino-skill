package jp.molino.skill.advice;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.common.TaskOrder;
import jp.molino.skill.skill.Skill;
import jp.molino.skill.skill.SkillRepository;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffService;
import jp.molino.skill.task.TaskRepository;
import jp.molino.skill.task.WorkTask;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * スタッフの育成のアドバイスを作る。
 * AI にはスタッフの名前を送らず、ポジション・入店からの期間・仕事ごとの習熟度だけを送る。
 * 教える人は AI に選ばせず、DB から「教えられる（習熟度3）」在籍中のスタッフを選ぶ。
 */
@Service
public class AdviceService {
    static final int MAX_SUGGESTIONS = 3;
    private static final String[] LEVEL_LABELS = {"未経験", "教わった", "1人でできる", "教えられる"};

    static final String SYSTEM_PROMPT = """
            あなたは飲食店のホールで、スタッフの育成を担当する社員を手伝うアシスタントです。
            スタッフ1人の習熟度の一覧をもとに、次に教えるとよい仕事を提案してください。

            習熟度の意味:
            - 0 未経験: まだ教わっていない
            - 1 教わった: やり方は習ったが、まだ一人には任せられない
            - 2 1人でできる: 言われなくても一人でやり切れる
            - 3 教えられる: ほかの人に教えて、一人でできるまで育てられる

            提案のルール:
            - 「次に教える候補」の中から、優先度の高い順に最大3件を選ぶ。仕事名は候補の表記をそのまま使う
            - メインポジションの仕事と、すでに「教わった」状態の仕事を優先する
            - すでにできる仕事とのつながり（似た手順、同じ場所の仕事）を理由に含める
            - 入店から3か月以内の新人には、基本的な仕事から順に提案する
            - 理由は60文字程度で具体的に書く。本人の性格や能力を評価・批判する表現は使わない
            - overview には、このスタッフの育成の方針を1〜2文でまとめる
            """;

    private final AdviceClient adviceClient;
    private final StaffService staffService;
    private final TaskRepository tasks;
    private final SkillRepository skills;

    public AdviceService(AdviceClient adviceClient, StaffService staffService, TaskRepository tasks, SkillRepository skills) {
        this.adviceClient = adviceClient;
        this.staffService = staffService;
        this.tasks = tasks;
        this.skills = skills;
    }

    public AdviceResponse advise(Long staffId) {
        Staff staff = staffService.find(staffId);
        List<WorkTask> allTasks = tasks.findAllByOrderByIdAsc().stream()
                .sorted(Comparator.comparingInt(TaskOrder::index))
                .toList();
        Map<Long, Integer> levels = skills.findByStaffId(staffId).stream()
                .collect(Collectors.toMap(Skill::getTaskId, Skill::getLevel));
        // まだ1人ではできない（習熟度1以下の）仕事だけを、次に教える候補にする
        List<WorkTask> candidates = allTasks.stream()
                .filter(task -> levels.getOrDefault(task.getId(), 0) < 2)
                .toList();
        if (candidates.isEmpty()) {
            return new AdviceResponse("すべての仕事を1人でできる状態です。ほかのスタッフに教える役割を任せることを検討してください。", List.of());
        }

        AiAdvice advice = adviceClient.ask(SYSTEM_PROMPT, buildUserPrompt(staff, allTasks, levels, candidates));
        Map<String, WorkTask> candidatesByName = candidates.stream()
                .collect(Collectors.toMap(WorkTask::getName, Function.identity(), (first, second) -> first, LinkedHashMap::new));
        // AI が候補にない仕事名を返すことがあるので、候補と一致するものだけを使う
        List<AdviceResponse.Suggestion> suggestions = advice.suggestions() == null ? List.of() : advice.suggestions().stream()
                .filter(item -> item.taskName() != null && candidatesByName.containsKey(item.taskName().trim()))
                .map(item -> {
                    WorkTask task = candidatesByName.get(item.taskName().trim());
                    return new AdviceResponse.Suggestion(task.getId(), task.getName(), task.getPosition(),
                            levels.getOrDefault(task.getId(), 0), item.reason(), teachersOf(task.getId(), staffId));
                })
                .distinct()
                .limit(MAX_SUGGESTIONS)
                .toList();
        if (suggestions.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI の提案を読み取れませんでした。もう一度お試しください");
        }
        return new AdviceResponse(advice.overview(), suggestions);
    }

    /** AI に送る内容。名前などの個人を特定できる情報は含めない。 */
    static String buildUserPrompt(Staff staff, List<WorkTask> allTasks, Map<Long, Integer> levels, List<WorkTask> candidates) {
        long months = ChronoUnit.MONTHS.between(staff.getJoinDate(), LocalDate.now());
        StringBuilder text = new StringBuilder();
        text.append("メインポジション: ").append(staff.getPosition()).append('\n');
        text.append("入店からの期間: ").append(months).append("か月")
                .append(StaffService.isNewcomer(staff.getJoinDate()) ? "（新人）" : "").append("\n\n");
        text.append("習熟度の一覧（ポジション / 仕事名 / 習熟度）:\n");
        for (WorkTask task : allTasks) {
            int level = levels.getOrDefault(task.getId(), 0);
            text.append("- ").append(task.getPosition()).append(" / ").append(task.getName())
                    .append(" / ").append(level).append(' ').append(LEVEL_LABELS[level]).append('\n');
        }
        text.append("\n次に教える候補（習熟度が1以下の仕事）:\n");
        for (WorkTask task : candidates) {
            text.append("- ").append(task.getName()).append('\n');
        }
        return text.toString();
    }

    private List<String> teachersOf(Long taskId, Long excludeStaffId) {
        return skills.findByTaskId(taskId).stream()
                .filter(skill -> skill.getLevel() == 3 && !skill.getStaffId().equals(excludeStaffId))
                .map(skill -> staffService.find(skill.getStaffId()))
                .filter(Staff::isActive)
                .map(Staff::getName)
                .sorted()
                .toList();
    }
}
