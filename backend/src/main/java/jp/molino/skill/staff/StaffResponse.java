package jp.molino.skill.staff;

/**
 * 画面に返すスタッフの情報。
 *
 * @param status   active を画面表示用にした値（「在籍」または「退職」）
 * @param newcomer 入店から3か月以内か。日付で変わるため保存せず、返すたびに計算する
 */
public record StaffResponse(
        Long id,
        String name,
        String position,
        String joinDate,
        boolean active,
        String status,
        boolean newcomer,
        String note) {

    public static StaffResponse from(Staff staff) {
        return new StaffResponse(
                staff.getId(),
                staff.getName(),
                staff.getPosition(),
                staff.getJoinDate().toString(),
                staff.isActive(),
                staff.isActive() ? "在籍" : "退職",
                StaffService.isNewcomer(staff.getJoinDate()),
                staff.getNote());
    }
}
