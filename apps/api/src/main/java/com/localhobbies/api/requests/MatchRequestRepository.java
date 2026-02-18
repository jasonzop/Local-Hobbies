package com.localhobbies.api.requests;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {
    List<MatchRequest> findBySenderKeyOrderByCreatedAtDesc(String senderKey);
    List<MatchRequest> findByReceiverIdOrderByCreatedAtDesc(String receiverId);
    List<MatchRequest> findByReceiverIdInOrderByCreatedAtDesc(List<String> receiverIds);

}
