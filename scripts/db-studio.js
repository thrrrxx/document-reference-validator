import http from 'node:http';
import { Client } from 'pg';
import 'dotenv/config';

const PORT = 5555;
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:shpower123@localhost:5432/document_reference_validator?schema=public';

async function getPool() {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Helper response
  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // API: Get all tables and counts
  if (url.pathname === '/api/tables') {
    try {
      const client = await getPool();
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name NOT LIKE 'pg_%' 
          AND table_name NOT LIKE '_prisma_%'
        ORDER BY table_name;
      `);

      const tables = [];
      for (const row of tablesRes.rows) {
        const countRes = await client.query(`SELECT count(*)::int as count FROM "${row.table_name}"`);
        tables.push({
          name: row.table_name,
          count: countRes.rows[0].count,
        });
      }
      await client.end();
      return json({ tables });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // API: Get table rows
  if (url.pathname.startsWith('/api/table/')) {
    const tableName = decodeURIComponent(url.pathname.replace('/api/table/', ''));
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    try {
      const client = await getPool();

      // Get columns
      const colRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      const columns = colRes.rows.map(r => ({ name: r.column_name, type: r.data_type }));

      // Fetch rows
      let query = `SELECT * FROM "${tableName}"`;
      const queryParams = [];

      if (search.trim()) {
        const textCols = columns
          .filter(c => ['text', 'character varying', 'character'].includes(c.type))
          .map(c => `"${c.name}"::text ILIKE $1`);
        
        if (textCols.length > 0) {
          query += ` WHERE ${textCols.join(' OR ')}`;
          queryParams.push(`%${search.trim()}%`);
        }
      }

      query += ` LIMIT ${limit} OFFSET ${offset}`;
      const dataRes = await client.query(query, queryParams);

      // Total count
      let countQuery = `SELECT count(*)::int as total FROM "${tableName}"`;
      if (search.trim() && queryParams.length > 0) {
        const textCols = columns
          .filter(c => ['text', 'character varying', 'character'].includes(c.type))
          .map(c => `"${c.name}"::text ILIKE $1`);
        countQuery += ` WHERE ${textCols.join(' OR ')}`;
      }
      const countRes = await client.query(countQuery, queryParams);

      await client.end();
      return json({
        columns,
        rows: dataRes.rows,
        total: countRes.rows[0].total,
        page,
        limit,
      });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // Frontend HTML
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexusTrace - Database Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --sidebar: #0f172a;
      --card: #131d36;
      --border: #1e293b;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --tag-valid: #10b981;
      --tag-failed: #ef4444;
      --tag-pending: #f59e0b;
      --row-hover: #1e293b70;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    /* Sidebar */
    .sidebar {
      width: 280px;
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .brand {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
    }
    .brand-title {
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
    }
    .tables-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .table-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .table-item:hover {
      background: #1e293b60;
      color: var(--text);
    }
    .table-item.active {
      background: #1e293b;
      color: #fff;
      font-weight: 600;
      border-left: 3px solid var(--primary);
    }
    .table-badge {
      background: #0f172a;
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      margin-right: 6px;
      box-shadow: 0 0 8px #10b98180;
    }

    /* Main Area */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg);
    }
    .header {
      padding: 18px 28px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0c1222;
    }
    .header-left h1 {
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-left p {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .search-input {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      color: #fff;
      outline: none;
      width: 240px;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      width: 300px;
    }
    .btn {
      background: #1e293b;
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn:hover {
      background: #334155;
    }
    .btn-primary {
      background: var(--primary);
      border-color: var(--primary);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }

    /* Table Container */
    .content-area {
      flex: 1;
      overflow: auto;
      padding: 24px 28px;
    }
    .table-wrapper {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    thead {
      background: #0f172a;
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 2px solid var(--border);
    }
    th {
      padding: 12px 16px;
      font-weight: 600;
      color: #cbd5e1;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #1e293b60;
      color: #e2e8f0;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    tr:hover td {
      background: var(--row-hover);
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .badge-valid, .badge-approved { background: #064e3b; color: #34d399; }
    .badge-failed, .badge-rejected { background: #7f1d1d; color: #f87171; }
    .badge-pending, .badge-submitted { background: #78350f; color: #fbbf24; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

    /* Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 600px;
      max-width: 90vw;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h3 { font-size: 16px; }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #93c5fd;
      background: #090d16;
    }
    pre { white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="brand">
      <div class="brand-icon">NT</div>
      <div>
        <div class="brand-title">NexusTrace Studio</div>
        <div class="brand-subtitle">Local PostgreSQL 18</div>
      </div>
    </div>
    <div class="tables-list" id="tablesList">
      <div style="padding: 12px; color: var(--text-muted); font-size: 12px;">Loading tables...</div>
    </div>
    <div class="sidebar-footer">
      <div><span class="status-dot"></span>Connected: 5432</div>
      <button class="btn" style="padding: 4px 8px;" onclick="loadTables()">⟳</button>
    </div>
  </div>

  <div class="main">
    <div class="header">
      <div class="header-left">
        <h1 id="currentTableTitle">Select a Table</h1>
        <p id="tableStats">0 rows in database</p>
      </div>
      <div class="header-actions">
        <input type="text" id="searchInput" class="search-input" placeholder="Search in this table..." oninput="handleSearch()">
        <button class="btn" onclick="fetchTableData()">Refresh</button>
      </div>
    </div>

    <div class="content-area">
      <div class="table-wrapper">
        <table id="dataTable">
          <thead>
            <tr id="tableHead"><th>No Table Selected</th></tr>
          </thead>
          <tbody id="tableBody">
            <tr><td style="text-align: center; color: var(--text-muted); padding: 40px;">Pilih tabel di sidebar sebelah kiri untuk melihat data</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 id="modalTitle">Row Detail</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <pre id="modalJson"></pre>
      </div>
    </div>
  </div>

  <script>
    let currentTable = '';
    let currentColumns = [];
    let currentRows = [];

    async function loadTables() {
      try {
        const res = await fetch('/api/tables');
        const data = await res.json();
        const container = document.getElementById('tablesList');
        container.innerHTML = '';

        if (!data.tables || data.tables.length === 0) {
          container.innerHTML = '<div style="padding: 12px; color: var(--text-muted);">Tidak ada tabel</div>';
          return;
        }

        data.tables.forEach((t, idx) => {
          const item = document.createElement('div');
          item.className = 'table-item' + (currentTable === t.name || (!currentTable && idx === 0) ? ' active' : '');
          item.innerHTML = '<span>' + t.name + '</span><span class="table-badge">' + t.count + '</span>';
          item.onclick = () => selectTable(t.name);
          container.appendChild(item);
        });

        if (!currentTable && data.tables.length > 0) {
          selectTable(data.tables[0].name);
        }
      } catch (e) {
        console.error(e);
      }
    }

    function selectTable(tableName) {
      currentTable = tableName;
      document.querySelectorAll('.table-item').forEach(el => {
        el.classList.toggle('active', el.querySelector('span').innerText === tableName);
      });
      document.getElementById('currentTableTitle').innerText = tableName;
      document.getElementById('searchInput').value = '';
      fetchTableData();
    }

    async function fetchTableData() {
      if (!currentTable) return;
      const search = document.getElementById('searchInput').value;
      const res = await fetch('/api/table/' + encodeURIComponent(currentTable) + '?search=' + encodeURIComponent(search));
      const data = await res.json();

      currentColumns = data.columns || [];
      currentRows = data.rows || [];

      document.getElementById('tableStats').innerText = (data.total || 0) + ' total baris data';

      // Render Head
      const thead = document.getElementById('tableHead');
      thead.innerHTML = '';
      currentColumns.forEach(c => {
        const th = document.createElement('th');
        th.innerText = c.name;
        thead.appendChild(th);
      });

      // Render Body
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      if (currentRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (currentColumns.length || 1) + '" style="text-align: center; color: var(--text-muted); padding: 40px;">Tidak ada data ditemukan</td></tr>';
        return;
      }

      currentRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => showRowDetail(row);

        currentColumns.forEach(c => {
          const td = document.createElement('td');
          const val = row[c.name];

          if (val === null || val === undefined) {
            td.innerHTML = '<span style="color: #64748b; font-style: italic;">null</span>';
          } else if (c.name.toLowerCase().includes('status')) {
            const statusUpper = String(val).toUpperCase();
            let badgeClass = 'badge ';
            if (statusUpper === 'VALID' || statusUpper === 'APPROVED' || statusUpper === 'SUCCESS') badgeClass += 'badge-valid';
            else if (statusUpper === 'FAILED' || statusUpper === 'REJECTED') badgeClass += 'badge-failed';
            else badgeClass += 'badge-pending';
            td.innerHTML = '<span class="' + badgeClass + '">' + val + '</span>';
          } else if (c.name.toLowerCase().includes('id') || c.name.toLowerCase().includes('number')) {
            td.className = 'mono';
            td.innerText = val;
          } else if (c.name.toLowerCase().includes('amount')) {
            td.className = 'mono';
            td.innerText = Number(val).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
          } else {
            td.innerText = typeof val === 'object' ? JSON.stringify(val) : val;
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    let searchTimer;
    function handleSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(fetchTableData, 300);
    }

    function showRowDetail(row) {
      document.getElementById('modalTitle').innerText = currentTable + ' - Row Detail';
      document.getElementById('modalJson').innerText = JSON.stringify(row, null, 2);
      document.getElementById('modalBackdrop').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('modalBackdrop').style.display = 'none';
    }

    // Initial load
    loadTables();
  </script>
</body>
</html>
`);
});

server.listen(PORT, () => {
  console.log(`\n🚀 NexusTrace Database Studio running at: http://localhost:${PORT}\n`);
});
