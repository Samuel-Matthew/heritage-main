<?php

$pdo = new PDO('mysql:host=127.0.0.1;dbname=heritage_marketplace', 'root', '');

echo "\n=== Categories in Database ===\n";
$result = $pdo->query('SELECT id, name, is_active, total_products FROM categories ORDER BY id');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $active = $row['is_active'] ? 'Yes' : 'No';
    echo "ID: {$row['id']} | Name: {$row['name']} | Active: {$active} | Count: {$row['total_products']}\n";
}

echo "\n=== Products per Category ===\n";
$result = $pdo->query('SELECT category_id, category, status, COUNT(*) as product_count FROM products GROUP BY category_id, category, status ORDER BY category_id');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo "Category ID: {$row['category_id']} | Category: {$row['category']} | Status: {$row['status']} | Count: {$row['product_count']}\n";
}
