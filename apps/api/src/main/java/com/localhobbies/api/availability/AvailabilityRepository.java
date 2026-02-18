package com.localhobbies.api.availability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AvailabilityRepository extends JpaRepository<AvailabilitySlot, UUID> {
    List<AvailabilitySlot> findByOwnerKeyAndDateOrderByStartTimeAsc(String ownerKey, LocalDate date);
}
