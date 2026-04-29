package com.localhobbies.api.users;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import com.localhobbies.api.user.AppUser;
import com.localhobbies.api.user.AppUserRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")

public class UserController {

    private final AppUserRepository appUserRepository;

    public UserController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping("/discover")
    public List<DiscoverUserResponse> discoverUsers() {
        return appUserRepository.findAll().stream()
                .map(user -> new DiscoverUserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail()
                ))
                .toList();
    }

    public record DiscoverUserResponse(
            Long id,
            String name,
            String email
    ) {}

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

public record ProfileImageBody(String profileImageUrl) {}
@PatchMapping("/{id}/profile")
public AppUser updateProfile(
        @PathVariable Long id,
        @RequestBody ProfileBody body
) {
    AppUser user = appUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setName(body.name());
    user.setBio(body.bio());

    return appUserRepository.save(user);
}

public record ProfileBody(String name, String bio) {}
}
