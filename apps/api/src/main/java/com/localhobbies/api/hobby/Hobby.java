package com.localhobbies.api.hobby;

import jakarta.persistence.*;

@Entity
@Table(name = "hobbies", uniqueConstraints = {
        @UniqueConstraint(columnNames = "name")
})
public class Hobby {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    public Hobby() {}

    public Hobby(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
}
