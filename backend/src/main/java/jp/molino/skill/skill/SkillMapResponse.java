package jp.molino.skill.skill;

import java.util.List;
import jp.molino.skill.staff.StaffResponse;
import jp.molino.skill.task.TaskResponse;

/**
 * スキルマップ画面に返す値。
 *
 * @param cells     習熟度が1以上のマスだけを持つ。含まれないマスは未経験（0）として表示する
 * @param updatedOn 表示中のマスで、いちばん新しい最終更新日。ない場合は空文字
 */
public record SkillMapResponse(List<StaffResponse> staffs, List<TaskResponse> tasks, List<Cell> cells, String updatedOn) {

    /** 表の1マス。スタッフと仕事の組み合わせと、その習熟度。 */
    public record Cell(Long staffId, Long taskId, int level) {
    }
}
