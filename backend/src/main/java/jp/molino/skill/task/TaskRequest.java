package jp.molino.skill.task;

/** 仕事の登録・更新で画面から受け取る値。検証は TaskService で行う。 */
public record TaskRequest(String name, String position) {
}
