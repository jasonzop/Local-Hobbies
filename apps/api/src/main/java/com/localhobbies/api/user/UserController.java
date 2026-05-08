package com.localhobbies.api.user;

import com.localhobbies.api.availability.AvailabilityRepository;
import com.localhobbies.api.availability.AvailabilitySlot;

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
import java.util.Objects;

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

    @GetMapping("/search")
    public List<UserSearchResponse> searchUsers(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "") String hobby,
            @RequestParam(required = false) Long currentUserId
    ) {
        String cleanedQuery = query.trim();
        String cleanedHobby = hobby.trim().toLowerCase();

        List<AppUser> users;

        if (cleanedQuery.isBlank()) {
            users = appUserRepository.findAll();
        } else {
            users = appUserRepository
                    .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                            cleanedQuery,
                            cleanedQuery
                    );
        }

        return users.stream()
                .filter(user -> currentUserId == null || !user.getId().equals(currentUserId))
                .filter(user ->
                        cleanedHobby.isBlank()
                                || user.getHobbies().stream()
                                .anyMatch(h -> h.toLowerCase().contains(cleanedHobby))
                )
                .map(user -> new UserSearchResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getProfileImageUrl(),
                        user.getCoverImageUrl(),
                        user.getBio(),
                        user.getHobbies(),
                        null
                ))
                .toList();
    }

    @GetMapping("/nearby")
    public List<UserSearchResponse> nearbyUsers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Double radiusMiles,
            @RequestParam(required = false) Long currentUserId
    ) {
        return appUserRepository.findAll().stream()
                .filter(user -> currentUserId == null || !user.getId().equals(currentUserId))
                .filter(user -> user.getLatitude() != null && user.getLongitude() != null)
                .map(user -> {
                    double distance = calculateDistanceMiles(
                            latitude,
                            longitude,
                            user.getLatitude(),
                            user.getLongitude()
                    );

                    return new UserSearchResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getProfileImageUrl(),
                            user.getCoverImageUrl(),
                            user.getBio(),
                            user.getHobbies(),
                            distance
                    );
                })
                .filter(user -> user.distanceMiles() <= radiusMiles)
                .sorted((a, b) -> Double.compare(a.distanceMiles(), b.distanceMiles()))
                .toList();
    }

    @GetMapping("/discover")
    public List<DiscoverUserResponse> discoverUsers(
            @RequestParam Long userId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime
    ) {
        LocalDate selectedDate = LocalDate.parse(date);
        LocalTime selectedStart = LocalTime.parse(startTime);
        LocalTime selectedEnd = LocalTime.parse(endTime);

        List<AvailabilitySlot> slots = availabilityRepository.findAll();

        return slots.stream()
                .filter(slot -> !slot.getUserId().equals(userId))
                .filter(slot -> slot.getDate().equals(selectedDate))
                .filter(slot ->
                        slot.getStartTime().isBefore(selectedEnd)
                                && slot.getEndTime().isAfter(selectedStart)
                )
                .map(slot -> appUserRepository.findById(slot.getUserId()).orElse(null))
                .filter(Objects::nonNull)
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

    @PatchMapping("/{id}/location")
    public AppUser updateLocation(
            @PathVariable Long id,
            @RequestBody LocationBody body
    ) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLatitude(body.latitude());
        user.setLongitude(body.longitude());

        return appUserRepository.save(user);
    }

    private double calculateDistanceMiles(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        final int earthRadiusKm = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2)
                        * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distanceKm = earthRadiusKm * c;

        return distanceKm * 0.621371;
    }

    public record UserSearchResponse(
            Long id,
            String name,
            String email,
            String profileImageUrl,
            String coverImageUrl,
            String bio,
            List<String> hobbies,
            Double distanceMiles
    ) {}

    public record DiscoverUserResponse(
            Long id,
            String name,
            String email,
            String profileImageUrl,
            String coverImageUrl,
            String bio,
            List<String> hobbies
    ) {}

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

    public record LocationBody(
            Double latitude,
            Double longitude
    ) {}
}