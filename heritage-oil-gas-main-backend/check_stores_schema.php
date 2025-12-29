<?php

$pdo = new PDO('mysql:host=127.0.0.1;dbname=heritage', 'root', '');

// Get all columns in stores table
echo "\n=== Stores Table Columns ===\n";
$result = $pdo->query("DESCRIBE stores");
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo "- {$row['Field']}\n";
}

// Get a sample store record
echo "\n=== Sample Store Data ===\n";
$result = $pdo->query("SELECT * FROM stores LIMIT 1");
$store = $result->fetch(PDO::FETCH_ASSOC);
if ($store) {
    foreach ($store as $key => $value) {
        echo "$key: " . ($value ? $value : 'NULL') . "\n";
    }
}

echo "\n=== All Stores in DB ===\n";
$result = $pdo->query("SELECT id, name, state, city FROM stores");
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']} | Name: {$row['name']} | State: {$row['state']} | City: {$row['city']}\n";
}
