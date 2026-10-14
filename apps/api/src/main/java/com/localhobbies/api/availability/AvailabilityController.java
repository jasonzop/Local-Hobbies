package com.localhobbies.api.availability;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @PutMapping("/me/availability/week")
    @Transactional
    public List<AvailabilitySlot> replaceWeek(@RequestBody ReplaceAvailabilityRequest req) {
        if (req.userId() == null || req.userId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        Long userId = Long.parseLong(req.userId());
        LocalDate weekStart = LocalDate.parse(req.weekStart());
        LocalDate weekEnd = LocalDate.parse(req.weekEnd());

        if (weekEnd.isBefore(weekStart) || weekEnd.isAfter(weekStart.plusDays(6))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid week range");
        }

        Map<String, AvailabilitySlot> replacements = new LinkedHashMap<>();

        for (AvailabilityInput slot : req.slots() == null ? List.<AvailabilityInput>of() : req.slots()) {
            LocalDate date = LocalDate.parse(slot.date());
            LocalTime start = LocalTime.parse(slot.startTime());
            LocalTime end = LocalTime.parse(slot.endTime());

            if (date.isBefore(weekStart) || date.isAfter(weekEnd)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A slot falls outside the selected week");
            }
            if (!end.isAfter(start)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A slot has an invalid time range");
            }

            replacements.put(date + "|" + start + "|" + end, new AvailabilitySlot(userId, date, start, end));
        }

        List<AvailabilitySlot> existing = availabilityRepository
                .findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(userId, weekStart, weekEnd);
        availabilityRepository.deleteAll(existing);
        availabilityRepository.saveAll(replacements.values());

        return availabilityRepository
                .findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(userId, weekStart, weekEnd);
    }

    public record CreateAvailabilityRequest(
            String userId,
            String date,
            String startTime,
            String endTime
    ) {}

    public record AvailabilityInput(
            String date,
            String startTime,
            String endTime
    ) {}

    public record ReplaceAvailabilityRequest(
            String userId,
            String weekStart,
            String weekEnd,
            List<AvailabilityInput> slots
    ) {}
}

