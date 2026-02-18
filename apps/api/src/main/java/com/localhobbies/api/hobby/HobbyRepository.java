package com.localhobbies.api.hobby;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HobbyRepository extends JpaRepository<Hobby, Long> {
    Optional<Hobby> findByNameIgnoreCase(String name);
}
