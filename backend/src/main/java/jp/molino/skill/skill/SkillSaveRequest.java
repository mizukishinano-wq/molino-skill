package jp.molino.skill.skill;

import java.util.List;

/** スキルの一括保存で画面から受け取る値。 */
public record SkillSaveRequest(List<Item> items) {

    /**
     * 仕事1件分の習熟度。
     * 画面からは数値でも文字列でも届くため文字列で受け取り、SkillService で数値に変換して範囲を確認する。
     */
    public record Item(String taskId, String level) {
    }
}
