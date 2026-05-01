package com.localhobbies.api.requests;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {

    List<MatchRequest> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<MatchRequest> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    boolean existsBySenderIdAndReceiverIdAndDateAndStartTimeAndEndTime(
            Long senderId,
            Long receiverId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    );
}