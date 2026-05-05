package com.localhobbies.api.auth;

import java.util.List;

public class AuthResponse {
    private Long id;
    private String name;
    private String email;
    private String bio;
    private String profileImageUrl;
    private String coverImageUrl;
    private List<String> hobbies;
    private String message;

    public AuthResponse(
            Long id,
            String name,
            String email,
            String bio,
            String profileImageUrl,
            String coverImageUrl,
            List<String> hobbies,
            String message
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.coverImageUrl = coverImageUrl;
        this.hobbies = hobbies;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getBio() {
        return bio;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public List<String> getHobbies() {
        return hobbies;
    }

    public String getMessage() {
        return message;
    }
}