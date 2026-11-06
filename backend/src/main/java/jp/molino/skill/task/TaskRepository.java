package jp.molino.skill.task;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<WorkTask, Long> {
    List<WorkTask> findAllByOrderByIdAsc();

    Optional<WorkTask> findByNameAndPosition(String name, String position);
}
