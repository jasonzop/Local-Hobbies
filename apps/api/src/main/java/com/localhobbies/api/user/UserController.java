package com.localhobbies.api.users;

import com.localhobbies.api.availability.AvailabilityRepository;
import com.localhobbies.api.availability.AvailabilitySlot;
import com.localhobbies.api.user.AppUser;
import com.localhobbies.api.user.AppUserRepository;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final AppUserRepository appUserRepository;
    private final AvailabilityRepository availabilityRepository;

    public UserController(
            AppUserRepository appUserRepository,
            AvailabilityRepository availabilityRepository
    ) {
        this.appUserRepository = appUserRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @GetMapping("/discover")
    public List<DiscoverUserResponse> discoverUsers(
            @RequestParam Long userId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime
    ) {
        LocalDate d = LocalDate.parse(date);
        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);

        List<AvailabilitySlot> slots = availabilityRepository.findAll();

        return slots.stream()
                .filter(slot -> !slot.getUserId().equals(userId))
                .filter(slot -> slot.getDate().equals(d))
                .filter(slot ->
                        slot.getStartTime().isBefore(end) &&
                        slot.getEndTime().isAfter(start)
                )
                .map(slot -> appUserRepository.findById(slot.getUserId()).orElse(null))
                .filter(user -> user != null)
                .distinct()
                .map(user -> new DiscoverUserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getProfileImageUrl(),
                        user.getCoverImageUrl(),
                        user.getBio(),
                        user.getHobbies()
                ))
                .toList();
    }

    public record DiscoverUserResponse(
            Long id,
            String name,
            String email,
            String profileImageUrl,
            String coverImageUrl,
            String bio,
            List<String> hobbies
    ) {}

    @GetMapping("/{id}")
    public AppUser getUser(@PathVariable Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PatchMapping("/{id}/profile")
    public AppUser updateProfile(
            @PathVariable Long id,
            @RequestBody ProfileBody body
    ) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(body.name());
        user.setBio(body.bio());

        if (body.hobbies() != null) {
            user.setHobbies(body.hobbies());
        }

        return appUserRepository.save(user);
    }

    @PatchMapping("/{id}/profile-setup")
    public AppUser completeProfileSetup(
            @PathVariable Long id,
            @RequestBody ProfileSetupBody body
    ) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(body.name());
        user.setBio(body.bio());
        user.setProfileImageUrl(body.profileImageUrl());
        user.setCoverImageUrl(body.coverImageUrl());
        user.setHobbies(body.hobbies());

        return appUserRepository.save(user);
    }

    @PatchMapping("/{id}/profile-image")
    public AppUser updateProfileImage(
            @PathVariable Long id,
            @RequestBody ProfileImageBody body
    ) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setProfileImageUrl(body.profileImageUrl());
        return appUserRepository.save(user);
    }

    @PatchMapping("/{id}/cover-image")
    public AppUser updateCoverImage(
            @PathVariable Long id,
            @RequestBody CoverImageBody body
    ) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setCoverImageUrl(body.coverImageUrl());
        return appUserRepository.save(user);
    }

    public record ProfileBody(
            String name,
            String bio,
            List<String> hobbies
    ) {}

    public record ProfileSetupBody(
            String name,
            String bio,
            String profileImageUrl,
            String coverImageUrl,
            List<String> hobbies
    ) {}

    public record ProfileImageBody(String profileImageUrl) {}

    public record CoverImageBody(String coverImageUrl) {}
}