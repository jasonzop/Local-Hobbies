package com.localhobbies.api.discover;

public class DiscoverResult {
    public String userId;
    public String displayName;
    public String bio;
    public double distanceMiles;

    public DiscoverResult(String userId, String displayName, String bio, double distanceMiles) {
        this.userId = userId;
        this.displayName = displayName;
        this.bio = bio;
        this.distanceMiles = distanceMiles;
    }
}
