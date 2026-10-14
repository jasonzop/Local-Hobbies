package com.localhobbies.api.availability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.time.LocalTime;
import java.util.UUID;

public interface AvailabilityRepository extends JpaRepository<AvailabilitySlot, UUID> {

    List<AvailabilitySlot> findByUserIdAndDateOrderByStartTimeAsc(Long userId, LocalDate date);
    List<AvailabilitySlot> findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(
        Long userId,
        LocalDate startDate,
        LocalDate endDate
    );
    boolean existsByUserIdAndDateAndStartTimeAndEndTime(
        Long userId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
);
}
