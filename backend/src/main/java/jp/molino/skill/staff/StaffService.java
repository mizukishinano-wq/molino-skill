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

    public List<StaffResponse> list(String name, String position, boolean includeRetired) {
        String keyword = name == null ? "" : name.trim();
        return staffs.findAllByOrderByJoinDateAscIdAsc().stream()
                .filter(staff -> includeRetired || staff.isActive())
                .filter(staff -> position == null || position.isBlank() || position.equals("全て") || staff.getPosition().equals(position))
                .filter(staff -> keyword.isEmpty() || staff.getName().contains(keyword))
                .map(StaffResponse::from)
                .toList();
    }

    public StaffResponse get(Long id) {
        return StaffResponse.from(find(id));
    }

    public Staff find(Long id) {
        return staffs.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "スタッフが見つかりません"));
    }

    @Transactional
    public StaffResponse create(StaffRequest request) {
        Staff staff = new Staff();
        apply(staff, request);
        staff.setActive(true);
        return StaffResponse.from(staffs.save(staff));
    }

    @Transactional
    public StaffResponse update(Long id, StaffRequest request) {
        Staff staff = find(id);
        apply(staff, request);
        String status = text(request.status());
        if ("退職".equals(status)) {
            staff.setActive(false);
        } else if ("在籍".equals(status)) {
            staff.setActive(true);
        }
        return StaffResponse.from(staffs.save(staff));
    }

    @Transactional
    public void delete(Long id) {
        find(id);
        // スキルはスタッフを参照しているため、先にスキルを消してからスタッフを消す
        skills.deleteByStaffId(id);
        staffs.deleteById(id);
    }

    public static boolean isNewcomer(LocalDate joinDate) {
        return !joinDate.plusMonths(3).isBefore(LocalDate.now());
    }

    private void apply(Staff staff, StaffRequest request) {
        String name = text(request.name());
        String position = text(request.position());
        String joinDate = text(request.joinDate());
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
        String note = text(request.note());
        if (note.length() > 200) {
            fields.put("note", "コメントは200文字以内で入力してください");
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
