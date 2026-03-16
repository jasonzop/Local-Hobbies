package com.localhobbies.api.requests;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {
    List<MatchRequest> findBySenderIdOrderByCreatedAtDesc(String senderId);
    List<MatchRequest> findByReceiverIdOrderByCreatedAtDesc(String receiverId);
}