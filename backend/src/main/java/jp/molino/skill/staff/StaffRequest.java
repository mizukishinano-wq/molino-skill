package jp.molino.skill.staff;

/**
 * スタッフの登録・更新で画面から受け取る値。
 * 値の検証（必須、文字数、日付の形式）は StaffService で行うため、ここでは文字列のまま受け取る。
 *
 * @param status 更新時のみ使う。「在籍」または「退職」
 */
public record StaffRequest(String name, String position, String joinDate, String status, String note) {
}
