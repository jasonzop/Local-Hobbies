package com.localhobbies.api.availability;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class AvailabilityController {

    private final AvailabilityRepository availabilityRepository;

    public AvailabilityController(AvailabilityRepository availabilityRepository) {
        this.availabilityRepository = availabilityRepository;
    }
    
@PostMapping("/me/availability")
public AvailabilitySlot create(@RequestBody CreateAvailabilityRequest req) {
    Long userId = Long.parseLong(req.userId());
    LocalDate date = LocalDate.parse(req.date());
    LocalTime start = LocalTime.parse(req.startTime());
    LocalTime end = LocalTime.parse(req.endTime());

    return availabilityRepository
            .findByUserIdAndDateOrderByStartTimeAsc(userId, date)
            .stream()
            .filter(slot -> slot.getStartTime().equals(start))
            .filter(slot -> slot.getEndTime().equals(end))
            .findFirst()
            .orElseGet(() -> {
                AvailabilitySlot slot = new AvailabilitySlot(userId, date, start, end);
                return availabilityRepository.save(slot);
            });
}

    @GetMapping("/me/availability")
    public List<AvailabilitySlot> list(
            @RequestParam Long userId,
            @RequestParam String date
    ) {
        LocalDate d = LocalDate.parse(date);
        return availabilityRepository.findByUserIdAndDateOrderByStartTimeAsc(userId, d);
    }

    public record CreateAvailabilityRequest(
            String userId,
            String date,
            String startTime,
            String endTime
    ) {}
}

