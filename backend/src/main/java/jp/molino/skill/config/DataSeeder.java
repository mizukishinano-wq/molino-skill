package jp.molino.skill.config;

import java.time.LocalDate;
import jp.molino.skill.skill.Skill;
import jp.molino.skill.skill.SkillRepository;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffRepository;
import jp.molino.skill.task.TaskRepository;
import jp.molino.skill.task.WorkTask;
import jp.molino.skill.user.UserAccount;
import jp.molino.skill.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final StaffRepository staffs;
    private final TaskRepository tasks;
    private final SkillRepository skills;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository users, StaffRepository staffs, TaskRepository tasks, SkillRepository skills,
            PasswordEncoder passwordEncoder) {
        this.users = users;
        this.staffs = staffs;
        this.tasks = tasks;
        this.skills = skills;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() == 0) {
            seed();
        }
        migrateDrinkTasks();
        migrateFreeTasks();
        migrateDeshapTasks();
        migrateEntranceTasks();
        migrateEighthFloorTasks();
        migrateOutsideTasks();
    }

    private void seed() {
        UserAccount manager = new UserAccount();
        manager.setName("佐藤店長");
        manager.setEmail("sato@example.com");
        manager.setPasswordHash(passwordEncoder.encode("password123"));
        users.save(manager);

        Staff sato = staff("佐藤美咲", "ドリンク", "2023-04-01", true);
        Staff tanaka = staff("田中健太", "ドリンク", "2024-01-15", true);
        Staff suzuki = staff("鈴木彩", "フリー", "2024-08-01", true);
        Staff takahashi = staff("高橋悠斗", "デシャップ", "2025-03-01", true);
        Staff yamamoto = staff("山本蓮", "入口", "2026-08-01", true);
        Staff ito = staff("伊藤葵", "ドリンク", "2026-09-01", true);
        Staff nakamura = staff("中村結衣", "8階", "2026-09-15", true);
        Staff kobayashi = staff("小林翔", "フリー", "2026-10-01", true);
        staff("渡辺修", "入口", "2022-06-01", false);

        WorkTask beer = task("生ビール", "ドリンク");
        WorkTask sour = task("サワー・ハイボール", "ドリンク");
        WorkTask cocktail = task("カクテル", "ドリンク");
        WorkTask machine = task("マシン飲料（紅茶・コーヒー・カフェオレ）", "ドリンク");
        task("ラテ系（抹茶・キャラメル）", "ドリンク");
        task("準備・補充", "ドリンク");
        WorkTask order = task("オーダー取り", "フリー");
        task("料理説明", "フリー");
        task("配膳", "フリー");
        WorkTask bussing = task("バッシング", "フリー");
        task("フロア対応", "フリー");
        WorkTask check = task("アレルギー・皿チェック", "デシャップ");
        task("指示出し", "デシャップ");
        task("先読み", "デシャップ");
        WorkTask reserve = task("予約受付", "入口");
        task("お会計", "入口");
        task("席の指示", "入口");
        task("周囲を見る", "入口");
        task("少人数で回す", "8階");
        task("7階に頼む物の把握", "8階");
        task("営業前・営業後・パソコン", "営業外");

        skill(sato, beer, 3, "2026-10-02");
        skill(sato, machine, 3, "2026-10-03");
        skill(sato, sour, 3, "2026-10-07");
        skill(sato, cocktail, 2, "2026-10-10");
        skill(sato, order, 3, "2026-10-01");

        skill(tanaka, beer, 3, "2026-10-04");
        skill(tanaka, sour, 3, "2026-09-12");
        skill(tanaka, cocktail, 2, "2026-08-20");
        skill(tanaka, machine, 3, "2026-08-02");

        skill(suzuki, beer, 2, "2026-10-06");
        skill(suzuki, sour, 3, "2026-09-15");
        skill(suzuki, machine, 3, "2026-08-11");

        skill(takahashi, beer, 2, "2026-10-08");
        skill(takahashi, sour, 2, "2026-07-22");
        skill(takahashi, machine, 2, "2026-06-01");

        skill(yamamoto, beer, 1, "2026-10-01");
        skill(yamamoto, machine, 2, "2026-09-28");

        skill(ito, beer, 2, "2026-10-09");
        skill(ito, sour, 2, "2026-10-11");
        skill(ito, machine, 2, "2026-09-30");

        skill(nakamura, machine, 1, "2026-10-05");
        skill(kobayashi, beer, 1, "2026-10-03");

        skill(suzuki, order, 2, "2026-08-19");
        skill(takahashi, check, 2, "2026-05-20");
        skill(kobayashi, bussing, 1, "2026-10-04");
        skill(sato, reserve, 2, "2026-04-12");
    }

    private void migrateDrinkTasks() {
        tasks.findByNameAndPosition("ソフトドリンク", "ドリンク").ifPresent(task -> {
            task.setName("マシン飲料（紅茶・コーヒー・カフェオレ）");
            tasks.save(task);
        });
        var sour = tasks.findByNameAndPosition("サワー", "ドリンク");
        var highball = tasks.findByNameAndPosition("ハイボール", "ドリンク");
        if (sour.isPresent()) {
            WorkTask kept = sour.get();
            kept.setName("サワー・ハイボール");
            tasks.save(kept);
            highball.ifPresent(other -> mergeAndDelete(other, kept));
        }
        tasks.findByNameAndPosition("グラス磨き", "ドリンク").ifPresent(task -> {
            skills.deleteByTaskId(task.getId());
            tasks.delete(task);
        });
        ensureTask("ラテ系（抹茶・キャラメル）", "ドリンク");
        ensureTask("準備・補充", "ドリンク");
    }

    private void migrateFreeTasks() {
        ensureTask("料理説明", "フリー");
        ensureTask("配膳", "フリー");
        ensureTask("フロア対応", "フリー");
    }

    private void migrateDeshapTasks() {
        tasks.findByNameAndPosition("料理の受け渡し", "デシャップ").ifPresent(task -> {
            skills.deleteByTaskId(task.getId());
            tasks.delete(task);
        });
        tasks.findByNameAndPosition("提供前チェック", "デシャップ").ifPresent(task -> {
            task.setName("アレルギー・皿チェック");
            tasks.save(task);
        });
        ensureTask("アレルギー・皿チェック", "デシャップ");
        ensureTask("指示出し", "デシャップ");
        ensureTask("先読み", "デシャップ");
    }

    private void migrateEntranceTasks() {
        tasks.findByNameAndPosition("案内", "入口").ifPresent(task -> {
            skills.deleteByTaskId(task.getId());
            tasks.delete(task);
        });
        tasks.findByNameAndPosition("予約確認", "入口").ifPresent(task -> {
            task.setName("予約受付");
            tasks.save(task);
        });
        ensureTask("予約受付", "入口");
        ensureTask("お会計", "入口");
        ensureTask("席の指示", "入口");
        ensureTask("周囲を見る", "入口");
    }

    private void migrateEighthFloorTasks() {
        for (String name : new String[] {"宴会セッティング", "コース説明"}) {
            tasks.findByNameAndPosition(name, "8階").ifPresent(task -> {
                skills.deleteByTaskId(task.getId());
                tasks.delete(task);
            });
        }
        ensureTask("少人数で回す", "8階");
        for (String name : new String[] {"7階のドリンク", "出すか7階に頼むか"}) {
            tasks.findByNameAndPosition(name, "8階").ifPresent(task -> {
                task.setName("7階に頼む物の把握");
                tasks.save(task);
            });
        }
        ensureTask("7階に頼む物の把握", "8階");
    }

    private void migrateOutsideTasks() {
        ensureTask("営業前・営業後・パソコン", "営業外");
    }

    private void mergeAndDelete(WorkTask from, WorkTask into) {
        for (Skill skill : skills.findByTaskId(from.getId())) {
            var existing = skills.findByStaffIdAndTaskId(skill.getStaffId(), into.getId());
            if (existing.isEmpty()) {
                skill.setTaskId(into.getId());
                skills.save(skill);
            } else if (skill.getLevel() > existing.get().getLevel()) {
                existing.get().setLevel(skill.getLevel());
                existing.get().setUpdatedOn(skill.getUpdatedOn());
                skills.save(existing.get());
                skills.delete(skill);
            } else {
                skills.delete(skill);
            }
        }
        skills.deleteByTaskId(from.getId());
        tasks.delete(from);
    }

    private void ensureTask(String name, String position) {
        if (tasks.findByNameAndPosition(name, position).isEmpty()) {
            task(name, position);
        }
    }

    private Staff staff(String name, String position, String joinDate, boolean active) {
        Staff staff = new Staff();
        staff.setName(name);
        staff.setPosition(position);
        staff.setJoinDate(LocalDate.parse(joinDate));
        staff.setActive(active);
        return staffs.save(staff);
    }

    private WorkTask task(String name, String position) {
        WorkTask task = new WorkTask();
        task.setName(name);
        task.setPosition(position);
        return tasks.save(task);
    }

    private void skill(Staff staff, WorkTask task, int level, String date) {
        Skill skill = new Skill();
        skill.setStaffId(staff.getId());
        skill.setTaskId(task.getId());
        skill.setLevel(level);
        skill.setUpdatedOn(LocalDate.parse(date));
        skills.save(skill);
    }
}
