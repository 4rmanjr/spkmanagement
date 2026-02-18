<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = __DIR__ . '/../penyegelan_pencabutan.db';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api/', '', $path);
$segments = explode('/', trim($path, '/'));
$endpoint = $segments[0] ?? '';
$id = $segments[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

function sendResponse($data, $success = true, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'data' => $data]);
    exit;
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

switch ($endpoint) {
    case 'stats':
        if ($method === 'GET') {
            // Get stats from penyegelan and pencabutan
            $penyegelanCount = $pdo->query("SELECT COUNT(*) as count FROM penyegelan")->fetch()['count'];
            $pencabutanCount = $pdo->query("SELECT COUNT(*) as count FROM pencabutan")->fetch()['count'];
            
            // Get stats by KET (keterangan)
            $penyegelanByKet = $pdo->query("SELECT KET, COUNT(*) as count FROM penyegelan GROUP BY KET")->fetchAll();
            $pencabutanByKet = $pdo->query("SELECT KET, COUNT(*) as count FROM pencabutan GROUP BY KET")->fetchAll();
            
            // Calculate total tunggakan
            $totalTunggakanPenyegelan = $pdo->query("SELECT SUM(JUMLAH) as total FROM penyegelan")->fetch()['total'] ?? 0;
            $totalTunggakanPencabutan = $pdo->query("SELECT SUM([JUMLAH TUNGGAKAN (Rp)]) as total FROM pencabutan")->fetch()['total'] ?? 0;
            
            sendResponse([
                'total_penyegelan' => (int)$penyegelanCount,
                'total_pencabutan' => (int)$pencabutanCount,
                'total_all' => (int)($penyegelanCount + $pencabutanCount),
                'penyegelan_by_ket' => $penyegelanByKet,
                'pencabutan_by_ket' => $pencabutanByKet,
                'total_tunggakan_penyegelan' => (float)$totalTunggakanPenyegelan,
                'total_tunggakan_pencabutan' => (float)$totalTunggakanPencabutan,
                'total_tunggakan_all' => (float)($totalTunggakanPenyegelan + $totalTunggakanPencabutan),
            ]);
        }
        break;
        
    case 'penyegelan':
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM penyegelan WHERE rowid = ?");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if ($data) {
                    sendResponse($data);
                } else {
                    sendError('Data not found', 404);
                }
            } else {
                // Get all with optional search
                $search = $_GET['search'] ?? '';
                $ket = $_GET['ket'] ?? '';
                
                $sql = "SELECT * FROM penyegelan WHERE 1=1";
                $params = [];
                
                if ($search) {
                    $sql .= " AND (\"NOMOR PELANGGAN\" LIKE ? OR NAMA LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                
                if ($ket) {
                    $sql .= " AND KET = ?";
                    $params[] = $ket;
                }
                
                $sql .= " ORDER BY TANGGAL DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                sendResponse($data);
            }
        } elseif ($method === 'PUT' && $id) {
            $input = json_decode(file_get_contents('php://input'), true);
            $allowedFields = ['NO.', 'TANGGAL', 'NOMOR PELANGGAN', 'NAMA', 'JUMLAH BLN', 'TOTAL REK', 'DENDA', 'JUMLAH', 'KET'];
            
            $fields = [];
            $values = [];
            foreach ($input as $key => $value) {
                if (in_array($key, $allowedFields)) {
                    $fields[] = "\"$key\" = ?";
                    $values[] = $value;
                }
            }
            
            if (empty($fields)) {
                sendError('No valid fields to update');
            }
            
            $values[] = $id;
            $sql = "UPDATE penyegelan SET " . implode(', ', $fields) . " WHERE rowid = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            
            sendResponse(['updated' => true]);
        }
        break;
        
    case 'pencabutan':
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM pencabutan WHERE rowid = ?");
                $stmt->execute([$id]);
                $data = $stmt->fetch();
                if ($data) {
                    sendResponse($data);
                } else {
                    sendError('Data not found', 404);
                }
            } else {
                // Get all with optional search
                $search = $_GET['search'] ?? '';
                $ket = $_GET['ket'] ?? '';
                
                $sql = "SELECT * FROM pencabutan WHERE 1=1";
                $params = [];
                
                if ($search) {
                    $sql .= " AND (\"NO SAMB\" LIKE ? OR NAMA LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                
                if ($ket) {
                    $sql .= " AND KET = ?";
                    $params[] = $ket;
                }
                
                $sql .= " ORDER BY NO";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $data = $stmt->fetchAll();
                sendResponse($data);
            }
        } elseif ($method === 'PUT' && $id) {
            $input = json_decode(file_get_contents('php://input'), true);
            $allowedFields = ['NO', 'NO SAMB', 'NAMA', 'ALAMAT', 'TOTAL TUNGGAKAN', 'JUMLAH TUNGGAKAN (Rp)', 'KET'];
            
            $fields = [];
            $values = [];
            foreach ($input as $key => $value) {
                if (in_array($key, $allowedFields)) {
                    $fields[] = "\"$key\" = ?";
                    $values[] = $value;
                }
            }
            
            if (empty($fields)) {
                sendError('No valid fields to update');
            }
            
            $values[] = $id;
            $sql = "UPDATE pencabutan SET " . implode(', ', $fields) . " WHERE rowid = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            
            sendResponse(['updated' => true]);
        }
        break;
        
    case 'generate-spk':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? ''; // 'penyegelan' or 'pencabutan'
            $ids = $input['ids'] ?? [];
            
            if (!in_array($type, ['penyegelan', 'pencabutan'])) {
                sendError('Invalid type');
            }
            
            if (empty($ids)) {
                sendError('No IDs provided');
            }
            
            $table = $type;
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("SELECT * FROM $table WHERE rowid IN ($placeholders)");
            $stmt->execute($ids);
            $data = $stmt->fetchAll();
            
            // Generate SPK numbers
            $year = date('Y');
            $spkList = [];
            foreach ($data as $index => $item) {
                $spkNumber = sprintf("SPK/%s/%s/%04d", strtoupper($type), $year, $index + 1);
                $spkList[] = [
                    'spk_number' => $spkNumber,
                    'data' => $item,
                    'type' => $type,
                    'generated_at' => date('Y-m-d H:i:s')
                ];
            }
            
            sendResponse(['spk_list' => $spkList, 'total' => count($spkList)]);
        }
        break;
        
    default:
        sendError('Endpoint not found', 404);
}

sendError('Method not allowed', 405);
