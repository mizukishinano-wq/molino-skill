package jp.molino.skill.skill;

/** スタッフ1人が持つスキル1件。スタッフ詳細とスキル一括編集で使う。 */
public record StaffSkillResponse(Long taskId, String taskName, String position, int level, String updatedOn) {
}
