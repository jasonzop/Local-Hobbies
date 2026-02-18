package com.localhobbies.api.availability;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
public class AvailabilityController {

    private final AvailabilityRepository availabilityRepository;

    public AvailabilityController(AvailabilityRepository availabilityRepository) {
        this.availabilityRepository = availabilityRepository;
    }

    @PostMapping("/me/availability")
    public AvailabilitySlot create(@RequestBody CreateAvailabilityRequest req) {
        LocalDate date = LocalDate.parse(req.date);
        LocalTime start = LocalTime.parse(req.startTime);
        LocalTime end = LocalTime.parse(req.endTime);

        AvailabilitySlot slot = new AvailabilitySlot(date, start, end);
        slot.setOwnerKey("me");
        slot.setStatus("available");

        return availabilityRepository.save(slot);
    }

    @GetMapping("/me/availability")
    public List<AvailabilitySlot> list(@RequestParam String date) {
        LocalDate d = LocalDate.parse(date);
        return availabilityRepository.findByOwnerKeyAndDateOrderByStartTimeAsc("me", d);
    }
}
