package jp.molino.skill.staff;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.common.Positions;
import jp.molino.skill.skill.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffService {
    private final StaffRepository staffs;
    private final SkillRepository skills;

    public StaffService(StaffRepository staffs, SkillRepository skills) {
        this.staffs = staffs;
        this.skills = skills;
    }

    public List<Map<String, Object>> list(String name, String position, boolean includeRetired) {
        String keyword = name == null ? "" : name.trim();
        return staffs.findAllByOrderByJoinDateAscIdAsc().stream()
                .filter(staff -> includeRetired || staff.isActive())
                .filter(staff -> position == null || position.isBlank() || position.equals("全て") || staff.getPosition().equals(position))
                .filter(staff -> keyword.isEmpty() || staff.getName().contains(keyword))
                .map(this::toMap)
                .toList();
    }

    public Map<String, Object> get(Long id) {
        return toMap(find(id));
    }

    public Staff find(Long id) {
        return staffs.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "スタッフが見つかりません"));
    }

    @Transactional
    public Map<String, Object> create(Map<String, String> body) {
        Staff staff = new Staff();
        apply(staff, body, true);
        staff.setActive(true);
        return toMap(staffs.save(staff));
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, String> body) {
        Staff staff = find(id);
        apply(staff, body, false);
        String status = text(body.get("status"));
        if ("退職".equals(status)) {
            staff.setActive(false);
        } else if ("在籍".equals(status)) {
            staff.setActive(true);
        }
        return toMap(staffs.save(staff));
    }

    @Transactional
    public void delete(Long id) {
        find(id);
        skills.deleteByStaffId(id);
        staffs.deleteById(id);
    }

    public Map<String, Object> toMap(Staff staff) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", staff.getId());
        map.put("name", staff.getName());
        map.put("position", staff.getPosition());
        map.put("joinDate", staff.getJoinDate().toString());
        map.put("active", staff.isActive());
        map.put("status", staff.isActive() ? "在籍" : "退職");
        map.put("newcomer", isNewcomer(staff.getJoinDate()));
        map.put("note", staff.getNote());
        return map;
    }

    public static boolean isNewcomer(LocalDate joinDate) {
        return !joinDate.plusMonths(3).isBefore(LocalDate.now());
    }

    private void apply(Staff staff, Map<String, String> body, boolean creating) {
        String name = text(body.get("name"));
        String position = text(body.get("position"));
        String joinDate = text(body.get("joinDate"));
        Map<String, String> fields = new LinkedHashMap<>();
        if (name.isEmpty()) {
            fields.put("name", "名前を入力してください");
        } else if (name.length() > 20) {
            fields.put("name", "名前は20文字以内で入力してください");
        }
        if (!Positions.contains(position)) {
            fields.put("position", "メインポジションを選んでください");
        }
        LocalDate parsed = null;
        if (joinDate.isEmpty()) {
            fields.put("joinDate", "入店日を入力してください");
        } else {
            try {
                parsed = LocalDate.parse(joinDate);
            } catch (DateTimeParseException exception) {
                fields.put("joinDate", "入店日の形式が正しくありません");
            }
        }
        String note = text(body.get("note"));
        if (note.length() > 200) {
            fields.put("note", "メモは200文字以内で入力してください");
        }
        if (!fields.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "入力内容を確認してください", fields);
        }
        staff.setName(name);
        staff.setPosition(position);
        staff.setJoinDate(parsed);
        staff.setNote(note);
    }

    private String text(String value) {
        return value == null ? "" : value.trim();
    }
}
