<?php
$dbPath = '/home/armanjr/gitporject/mailinglistcli/web/penyegelan_pencabutan.db';
try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $result = $pdo->query('SELECT COUNT(*) as count FROM penyegelan')->fetch();
    echo "Penyegelan count: " . $result['count'] . "\n";
    
    $result = $pdo->query('SELECT COUNT(*) as count FROM pencabutan')->fetch();
    echo "Pencabutan count: " . $result['count'] . "\n";
    
    echo "Database connection successful!\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
