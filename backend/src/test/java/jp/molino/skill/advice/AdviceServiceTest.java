package jp.molino.skill.advice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.skill.Skill;
import jp.molino.skill.skill.SkillRepository;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffService;
import jp.molino.skill.task.TaskRepository;
import jp.molino.skill.task.WorkTask;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

/** AI は呼ばず（AdviceClient を偽物に差し替えて）、送る内容と回答の扱いを確認する。 */
class AdviceServiceTest {
    private AdviceClient adviceClient;
    private StaffService staffService;
    private TaskRepository tasks;
    private SkillRepository skills;
    private AdviceService service;

    private Staff target;
    private WorkTask beer;
    private WorkTask cocktail;
    private WorkTask order;

    @BeforeEach
    void setUp() {
        adviceClient = mock(AdviceClient.class);
        staffService = mock(StaffService.class);
        tasks = mock(TaskRepository.class);
        skills = mock(SkillRepository.class);
        service = new AdviceService(adviceClient, staffService, tasks, skills);

        target = staff(1L, "山田花子", "ドリンク", LocalDate.now().minusMonths(1), true);
        beer = task(10L, "生ビール", "ドリンク");
        cocktail = task(11L, "カクテル", "ドリンク");
        order = task(12L, "オーダー取り", "フリー");
        when(staffService.find(1L)).thenReturn(target);
        when(tasks.findAllByOrderByIdAsc()).thenReturn(List.of(beer, cocktail, order));
    }

    @Test
    void 送る内容にスタッフの名前を含めず_1人でできる仕事は候補にしない() {
        String prompt = AdviceService.buildUserPrompt(target, List.of(beer, cocktail, order), Map.of(10L, 2, 11L, 1), List.of(cocktail, order));

        assertThat(prompt).doesNotContain("山田花子");
        assertThat(prompt).contains("メインポジション: ドリンク", "（新人）");
        assertThat(prompt).contains("- ドリンク / 生ビール / 2 1人でできる", "- ドリンク / カクテル / 1 教わった", "- フリー / オーダー取り / 0 未経験");
        String candidates = prompt.substring(prompt.indexOf("次に教える候補"));
        assertThat(candidates).contains("- カクテル", "- オーダー取り").doesNotContain("生ビール");
    }

    @Test
    void 候補にない仕事名は捨て_教えられる人は在籍中の習熟度3の人だけにする() {
        when(skills.findByStaffId(1L)).thenReturn(List.of(skill(1L, 10L, 2), skill(1L, 11L, 1)));
        Staff sato = staff(2L, "佐藤美咲", "ドリンク", LocalDate.of(2023, 4, 1), true);
        Staff retired = staff(3L, "渡辺修", "入口", LocalDate.of(2022, 6, 1), false);
        when(staffService.find(2L)).thenReturn(sato);
        when(staffService.find(3L)).thenReturn(retired);
        when(skills.findByTaskId(11L)).thenReturn(List.of(skill(2L, 11L, 3), skill(3L, 11L, 3), skill(1L, 11L, 1)));
        when(skills.findByTaskId(12L)).thenReturn(List.of());
        when(adviceClient.ask(anyString(), anyString())).thenReturn(new AiAdvice("基本から順に教えましょう。", List.of(
                new AiAdvice.Suggestion("カクテル", "生ビールができるので、次はカクテル。"),
                new AiAdvice.Suggestion("存在しない仕事", "AI が作った仕事名"),
                new AiAdvice.Suggestion("生ビール", "すでにできる仕事は候補ではない"),
                new AiAdvice.Suggestion(" オーダー取り ", "前後の空白は許す"))));

        AdviceResponse response = service.advise(1L);

        assertThat(response.overview()).isEqualTo("基本から順に教えましょう。");
        assertThat(response.suggestions()).extracting(AdviceResponse.Suggestion::taskName).containsExactly("カクテル", "オーダー取り");
        AdviceResponse.Suggestion first = response.suggestions().get(0);
        assertThat(first.currentLevel()).isEqualTo(1);
        assertThat(first.teachers()).containsExactly("佐藤美咲");
        assertThat(response.suggestions().get(1).teachers()).isEmpty();
    }

    @Test
    void すべての仕事を1人でできるなら_AI_を呼ばない() {
        when(skills.findByStaffId(1L)).thenReturn(List.of(skill(1L, 10L, 2), skill(1L, 11L, 3), skill(1L, 12L, 2)));

        AdviceResponse response = service.advise(1L);

        assertThat(response.suggestions()).isEmpty();
        verify(adviceClient, never()).ask(anyString(), anyString());
    }

    @Test
    void 使える提案が1つもなければ_502_を返す() {
        when(skills.findByStaffId(1L)).thenReturn(List.of());
        when(adviceClient.ask(anyString(), anyString()))
                .thenReturn(new AiAdvice("方針", List.of(new AiAdvice.Suggestion("存在しない仕事", "理由"))));

        assertThatThrownBy(() -> service.advise(1L))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    private static Staff staff(Long id, String name, String position, LocalDate joinDate, boolean active) {
        Staff staff = new Staff();
        ReflectionTestUtils.setField(staff, "id", id);
        staff.setName(name);
        staff.setPosition(position);
        staff.setJoinDate(joinDate);
        staff.setActive(active);
        return staff;
    }

    private static WorkTask task(Long id, String name, String position) {
        WorkTask task = new WorkTask();
        ReflectionTestUtils.setField(task, "id", id);
        task.setName(name);
        task.setPosition(position);
        return task;
    }

    private static Skill skill(Long staffId, Long taskId, int level) {
        Skill skill = new Skill();
        skill.setStaffId(staffId);
        skill.setTaskId(taskId);
        skill.setLevel(level);
        skill.setUpdatedOn(LocalDate.of(2026, 11, 1));
        return skill;
    }
}
