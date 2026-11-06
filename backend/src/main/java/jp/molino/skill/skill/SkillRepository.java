package jp.molino.skill.skill;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findByStaffId(Long staffId);

    List<Skill> findByTaskId(Long taskId);

    Optional<Skill> findByStaffIdAndTaskId(Long staffId, Long taskId);

    void deleteByStaffId(Long staffId);

    void deleteByTaskId(Long taskId);
}
