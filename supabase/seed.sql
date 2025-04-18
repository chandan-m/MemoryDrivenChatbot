INSERT INTO users (id, name, age, gender, created_at, updated_at)
VALUES
    ('a1b2c3d4-e5f6-4789-9101-112233445566', 'Alice', 30, 'Female', NOW(), NOW()),
    ('b2c3d4e5-f6a7-4789-9102-223344556677', 'Bob', 25, 'Male', NOW(), NOW()),
    ('c3d4e5f6-a7b8-4789-9103-334455667788', 'Charlie', 35, 'Male', NOW(), NOW());

INSERT INTO messages (user_id, role, content, timestamp)
VALUES
    ('a1b2c3d4-e5f6-4789-9101-112233445566', 'user', 'Hi, I need help with my account!', NOW()),
    ('a1b2c3d4-e5f6-4789-9101-112233445566', 'assistant', 'Sure! How can I assist you today?', NOW()),
    ('b2c3d4e5-f6a7-4789-9102-223344556677', 'user', 'What is the weather like today?', NOW()),
    ('b2c3d4e5-f6a7-4789-9102-223344556677', 'assistant', 'The weather is sunny with a high of 25°C today.', NOW()),
    ('c3d4e5f6-a7b8-4789-9103-334455667788', 'user', 'Can I change my appointment time?', NOW()),
    ('c3d4e5f6-a7b8-4789-9103-334455667788', 'assistant', 'Yes, let me know your preferred time.', NOW());