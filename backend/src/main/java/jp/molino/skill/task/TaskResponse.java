package jp.molino.skill.task;

/**
 * 画面に返す仕事の情報。
 *
 * @param capableCount この仕事が「できる人」（習熟度2以上かつ在籍中）の人数
 */
public record TaskResponse(Long id, String name, String position, long capableCount) {

    public static TaskResponse of(WorkTask task, long capableCount) {
        return new TaskResponse(task.getId(), task.getName(), task.getPosition(), capableCount);
    }
}
