package com.nexora.config;

import com.nexora.model.Post;
import com.nexora.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Ensure the public schema exists before Hibernate performs DDL
        try {
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS public");
            System.out.println("[DB Migration] public schema exists or was created.");
        } catch (Exception e) {
            System.err.println("[DB Migration Warning] Could not create public schema: " + e.getMessage());
        }

        widenImageUrlColumns();

        // ── Make movies.hero and movies.heroine nullable (safe to run repeatedly)
        try {
            jdbcTemplate.execute("ALTER TABLE movies ALTER COLUMN hero DROP NOT NULL");
            System.out.println("[DB Migration] movies.hero -> nullable OK");
        } catch (Exception ignored) {
            // Already nullable – no action needed
        }
        try {
            jdbcTemplate.execute("ALTER TABLE movies ALTER COLUMN heroine DROP NOT NULL");
            System.out.println("[DB Migration] movies.heroine -> nullable OK");
        } catch (Exception ignored) {
            // Already nullable – no action needed
        }
        // ── Extend poster_url to TEXT in movies (for long external URLs)
        try {
            jdbcTemplate.execute("ALTER TABLE movies ALTER COLUMN poster_url TYPE TEXT");
            System.out.println("[DB Migration] movies.poster_url -> TEXT OK");
        } catch (Exception ignored) {}
        // ── Make web_series optional fields nullable
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ALTER COLUMN director DROP NOT NULL");
            System.out.println("[DB Migration] web_series.director -> nullable OK");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ALTER COLUMN lead_cast DROP NOT NULL");
            System.out.println("[DB Migration] web_series.lead_cast -> nullable OK");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ALTER COLUMN seasons DROP NOT NULL");
            System.out.println("[DB Migration] web_series.seasons -> nullable OK");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ALTER COLUMN release_date DROP NOT NULL");
            System.out.println("[DB Migration] web_series.release_date -> nullable OK");
        } catch (Exception ignored) {}
        // ── Extend poster_url to TEXT in web_series
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ALTER COLUMN poster_url TYPE TEXT");
            System.out.println("[DB Migration] web_series.poster_url -> TEXT OK");
        } catch (Exception ignored) {}
        // ── Add rating column if not exists
        try {
            jdbcTemplate.execute("ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION");
            System.out.println("[DB Migration] movies.rating column OK");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE web_series ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION");
            System.out.println("[DB Migration] web_series.rating column OK");
        } catch (Exception ignored) {}
        try {
            List<Post> posts = postRepository.findAll();
            boolean changedAny = false;
            for (Post post : posts) {
                boolean postChanged = false;
                for (Post.PostComment comment : post.getComments()) {
                    // Direct check using comment.getId() to see if it triggers lazy initialization/generation
                    // If it was null, comment.getId() mutates the entity object state to a UUID
                    // We can also double check by checking if post Repository needs save
                    String currentId = comment.getId();
                    // Just to be sure, if we mutate the object, Hibernate dirty checking will notice it.
                    // But we set it explicitly via setId if needed to be absolutely sure the change is tracked.
                    comment.setId(currentId);
                    postChanged = true;
                }
                if (postChanged && !post.getComments().isEmpty()) {
                    postRepository.save(post);
                    changedAny = true;
                }
            }
            if (changedAny) {
                System.out.println("[Database Migration] Checked and populated comment IDs with unique UUIDs.");
            }
        } catch (Exception e) {
            System.err.println("[Database Migration Warning] Failed to migrate comments: " + e.getMessage());
        }
    }

    private void widenImageUrlColumns() {
        String[] statements = {
            "ALTER TABLE users ALTER COLUMN profile_picture TYPE TEXT",
            "ALTER TABLE posts ALTER COLUMN image_url TYPE TEXT",
            "ALTER TABLE movies ALTER COLUMN poster_url TYPE TEXT",
            "ALTER TABLE web_series ALTER COLUMN poster_url TYPE TEXT",
            "ALTER TABLE games ALTER COLUMN cover_url TYPE TEXT",
            "ALTER TABLE places ALTER COLUMN photo_url TYPE TEXT",
            "ALTER TABLE restaurants ALTER COLUMN menu_image_url TYPE TEXT"
        };

        for (String statement : statements) {
            jdbcTemplate.execute(statement);
        }
        System.out.println("[DB Migration] Image URL columns support Cloudinary URLs.");
    }
}
