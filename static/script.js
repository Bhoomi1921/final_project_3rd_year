// ══════════════════════════════════════════════════════
// Safe Return — script.js  (Updated)
// ══════════════════════════════════════════════════════

// ── Backend base URLs ─────────────────────────────────
const API_BASE   = "https://final-project-3rd-year.onrender.com";   // face-recognition server
const FLASK_BASE = "https://final-project-3rd-year.onrender.com";  // main Flask server

let landingPage, loginModal, foundReportPage, mapPage, notificationsPage;
let adminDashboard, publicDashboard, registerInmatePage, reportLostPage;
let currentUserRole = "";

document.addEventListener('DOMContentLoaded', function () {
    landingPage        = document.getElementById('landingPage');
    loginModal         = document.getElementById('loginModal');
    foundReportPage    = document.getElementById('foundReportPage');
    mapPage            = document.getElementById('mapPage');
    notificationsPage  = document.getElementById('notificationsPage');
    adminDashboard     = document.getElementById('adminDashboard');
    publicDashboard    = document.getElementById('publicDashboard');
    registerInmatePage = document.getElementById('registerInmatePage');
    reportLostPage     = document.getElementById('reportLostPage');
    var lostCard  = document.getElementById('card-lost-person');
    var foundCard = document.getElementById('card-found-person');
    if (lostCard)  lostCard.onclick  = showReportForm;
    if (foundCard) foundCard.onclick = showFoundReportForm;
});

// ════════════════════════════════════════════════════
// ADMIN TABLE
// ════════════════════════════════════════════════════
var adminReports = [];

function renderAdminTable() {
    var q  = document.getElementById('admin-srch') ? document.getElementById('admin-srch').value.toLowerCase() : '';
    var fs = document.getElementById('admin-filt') ? document.getElementById('admin-filt').value : '';
    var data = adminReports.slice();
    if (fs) data = data.filter(function(r){ return r.status === fs; });
    if (q)  data = data.filter(function(r){ return r.name.toLowerCase().indexOf(q) !== -1; });

    var statTotal = document.getElementById('stat-total');
    var statFound = document.getElementById('stat-found');
    if (statTotal) statTotal.textContent = adminReports.length;
    if (statFound) statFound.textContent = adminReports.filter(function(r){ return r.status === 'Found'; }).length;

    var tb = document.getElementById('admin-tbl-body');
    if (!tb) return;
    if (!data.length) {
        tb.innerHTML = '<tr><td colspan="6"><div class="ar-empty"><i class="fas fa-search"></i><h3>No records found</h3><p>Adjust your search or filter.</p></div></td></tr>';
        return;
    }

    tb.innerHTML = data.map(function(r) {
        var statusKey = r.status.toLowerCase();

        // ── FIX: Build correct photo URL ──
        var avatarHtml;
        if (r.photo) {
            // r.photo is now stored as "/uploads/photos/filename.jpg"
            var imgSrc = r.photo.startsWith('http') ? r.photo : FLASK_BASE + r.photo;
            avatarHtml = '<img src="' + imgSrc + '" alt="' + r.name + '" '
                       + 'style="width:40px;height:40px;border-radius:50%;object-fit:cover;" '
                       + 'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'"/>'
                       + '<i class="fas fa-user" style="display:none"></i>';
        } else {
            avatarHtml = '<i class="fas fa-user"></i>';
        }

        var foundBtn = (r.status !== 'Found')
            ? '<button class="ar-btn ar-found-btn" onclick="markAdminFound(\'' + r.id + '\')">✅ Found</button>'
            : '';
        return '<tr>' +
            '<td><div class="apc"><div class="apc-ava">' + avatarHtml + '</div>' +
            '<div><div class="apc-name">' + r.name + '</div>' +
            '<div class="apc-sub">ID #' + r.id + ' · ' + r.date + '</div></div></div></td>' +
            '<td><strong>' + r.age + '</strong> · ' + r.gender + '</td>' +
            '<td style="max-width:160px;font-size:12.5px;line-height:1.4">' + (r.loc || '—') + '</td>' +
            '<td style="font-size:12.5px">' + r.date + '</td>' +
            '<td><span class="ar-badge ar-' + statusKey + '"><span class="ar-dot"></span>' + r.status + '</span></td>' +
            '<td><div class="ar-acts">' +
              '<button class="ar-btn" onclick="viewAdminDetail(\'' + r.id + '\')">View</button>' +
              '<button class="ar-btn ar-ai" onclick="runAdminRecog(\'' + r.id + '\')">🤖 Recognition</button>' +
              foundBtn +
            '</div></td>' +
        '</tr>';
    }).join('');
}

function markAdminFound(id) {
    var r = adminReports.find(function(x){ return String(x.id) === String(id); });
    if (r) { r.status = 'Found'; renderAdminTable(); }
    fetch(FLASK_BASE + '/mark-found/' + id, { method: 'POST' }).catch(function(e){ console.error(e); });
}

function viewAdminDetail(id) {
    var r = adminReports.find(function(x){ return String(x.id) === String(id); });
    if (!r) return;

    var old = document.getElementById('adminDetailModal');
    if (old) old.remove();

    var dark = document.body.classList.contains('dark-mode');
    var bg = dark ? '#1e293b' : '#fff';
    var textColor = dark ? '#f1f5f9' : '#0f172a';
    var subColor  = dark ? '#94a3b8' : '#64748b';
    var rowBg     = dark ? '#263345' : '#f8fafc';
    var borderCol = dark ? '#334155' : '#e2e8f0';

    var imgSrc = r.photo ? (r.photo.startsWith('http') ? r.photo : FLASK_BASE + r.photo) : null;
    var photoHtml = imgSrc
        ? '<img src="' + imgSrc + '" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #f97316;margin-bottom:8px;" onerror="this.style.display=\'none\'"/>'
        : '<div style="width:90px;height:90px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:8px;"><i class="fas fa-user" style="font-size:2.5rem;color:#94a3b8;"></i></div>';

    var rows = [
        ['Full Name',     r.name],
        ['Age',           r.age],
        ['Gender',        r.gender],
        ['Last Seen',     r.loc  || '—'],
        ['Date Reported', r.date || '—'],
        ['Status',        r.status],
        ['Contact Phone', r.familyPhone || '—'],
    ];

    var tableHtml = rows.map(function(row){
        return '<tr style="border-bottom:1px solid ' + borderCol + ';">' +
            '<td style="padding:8px 10px;color:' + subColor + ';font-size:.85rem;white-space:nowrap;">' + row[0] + '</td>' +
            '<td style="padding:8px 10px;font-weight:600;color:' + textColor + ';font-size:.9rem;">' + row[1] + '</td>' +
            '</tr>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'adminDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
    modal.innerHTML =
        '<div style="background:' + bg + ';border-radius:16px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:inherit;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
        '<h2 style="margin:0;font-size:1.1rem;font-weight:900;color:' + textColor + ';">📋 Person Details</h2>' +
        '<button onclick="document.getElementById(\'adminDetailModal\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;">×</button></div>' +
        '<div style="text-align:center;margin-bottom:16px;">' + photoHtml + '</div>' +
        '<table style="width:100%;border-collapse:collapse;background:' + rowBg + ';border-radius:10px;overflow:hidden;">' + tableHtml + '</table>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:18px;">' +
        '<button onclick="document.getElementById(\'adminDetailModal\').remove()" style="padding:10px 24px;background:#f1f5f9;color:#334155;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Close</button></div>' +
        '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
}

function loadAdminReports() {
    fetch(FLASK_BASE + '/get-reports')
        .then(function(res){ return res.json(); })
        .then(function(data){
            if (Array.isArray(data) && data.length > 0) {
                adminReports = data.map(function(r){
                    // ── FIX: photo_path is now stored as "/uploads/photos/filename.jpg"
                    var photoUrl = null;
                    if (r.photo_path) {
                        // Support both old absolute paths and new relative paths
                        if (r.photo_path.startsWith('/uploads/')) {
                            photoUrl = r.photo_path;                          // relative → prepend FLASK_BASE when rendering
                        } else {
                            // Legacy absolute path — extract just the filename
                            var fn = r.photo_path.replace(/\\/g, '/').split('/').pop();
                            photoUrl = '/uploads/photos/' + fn;
                        }
                    }
                    return {
                        id:          r._id,
                        name:        r.full_name          || 'Unknown',
                        age:         r.age                || '—',
                        gender:      r.gender             || 'Unknown',
                        loc:         r.last_seen_location || '—',
                        date:        (r.last_seen_datetime || '').slice(0, 10),
                        status:      r.status             || 'Missing',
                        photo:       photoUrl,
                        familyPhone: r.contact_phone      || '',
                        familyEmail: r.contact_email      || '',
                        // Store Aadhaar (for match popup)
                        famAadhaar:  r.family_aadhaar      || '',
                        perAadhaar:  r.person_aadhaar      || '',
                        source:      'db'
                    };
                });
            }
            renderAdminTable();
        })
        .catch(function(err){ console.warn('Could not load reports:', err); renderAdminTable(); });
}

// ════════════════════════════════════════════════════
// FACE RECOGNITION
// ════════════════════════════════════════════════════
var _recogTargetId = null;

function runAdminRecog(id) {
    var r = adminReports.find(function(x){ return String(x.id) === String(id); });
    if (!r) return;
    _recogTargetId = id;
    if (r.photo) {
        if (r.photo.startsWith('data:')) { _showRecogModal(r.name, r.photo); return; }
        var photoUrl = r.photo.startsWith('http') ? r.photo : FLASK_BASE + r.photo;
        fetch(photoUrl)
            .then(function(res){ if (!res.ok) throw new Error('HTTP ' + res.status); return res.blob(); })
            .then(function(blob){
                var rd = new FileReader();
                rd.onload = function(e){ _showRecogModal(r.name, e.target.result); };
                rd.readAsDataURL(blob);
            })
            .catch(function(){ _showRecogModal(r.name, null); });
    } else {
        _showRecogModal(r.name, null);
    }
}

function _showRecogModal(name, photoDataURL) {
    var old = document.getElementById('recogModal');
    if (old) old.remove();
    var dark = document.body.classList.contains('dark-mode');
    var bg           = dark ? '#1e293b' : '#fff';
    var textColor    = dark ? '#f1f5f9' : '#0f172a';
    var subColor     = dark ? '#94a3b8' : '#64748b';
    var cancelBg     = dark ? '#263345' : '#f1f5f9';
    var cancelColor  = dark ? '#cbd5e1' : '#334155';
    var uploadBg     = dark ? '#263345' : '#fff';
    var uploadBorder = dark ? '#475569' : '#cbd5e1';

    var modal = document.createElement('div');
    modal.id = 'recogModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';

    var ps = '', ab = '';
    if (photoDataURL) {
        ps = '<div style="margin-bottom:18px;">' +
             '<p style="color:' + subColor + ';font-size:.85rem;margin:0 0 10px;">Photo from submitted report:</p>' +
             '<img src="' + photoDataURL + '" style="max-width:180px;max-height:180px;border-radius:10px;object-fit:cover;border:3px solid #3b82f6;"/>' +
             '</div>';
        ab = '<button onclick="autoRecognize()" style="padding:11px 28px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:.95rem;cursor:pointer;font-weight:700;font-family:inherit;">🔍 Run Face Recognition</button>' +
             '<button onclick="closeRecogModal()" style="padding:11px 22px;background:' + cancelBg + ';color:' + cancelColor + ';border:none;border-radius:8px;font-size:.9rem;cursor:pointer;font-family:inherit;">Cancel</button>';
    } else {
        ps = '<video id="recogVideo" autoplay playsinline muted style="width:100%;max-height:240px;border-radius:10px;background:#000;display:none;margin-bottom:12px;"></video>' +
             '<canvas id="recogCanvas" style="display:none;"></canvas>' +
             '<div id="recogUploadArea" onclick="document.getElementById(\'recogFileInput\').click()" style="border:2px dashed ' + uploadBorder + ';border-radius:10px;padding:28px 16px;margin-bottom:18px;cursor:pointer;color:' + subColor + ';font-size:.9rem;text-align:center;background:' + uploadBg + ';">' +
             '<div style="font-size:2.5rem;margin-bottom:8px;">📷</div><div>Click to upload a photo<br><small>or use the camera below</small></div>' +
             '<input type="file" id="recogFileInput" accept="image/*" style="display:none;" onchange="handleRecogFileSelect(event)"></div>';
        ab = '<button id="recogCamBtn" onclick="startRecogCamera()" style="padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:.9rem;cursor:pointer;font-family:inherit;">📹 Camera</button>' +
             '<button id="recogScanBtn" onclick="captureAndRecognize()" style="padding:10px 20px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:.9rem;cursor:pointer;display:none;font-family:inherit;">🔍 Scan</button>' +
             '<button onclick="closeRecogModal()" style="padding:10px 20px;background:' + cancelBg + ';color:' + cancelColor + ';border:none;border-radius:8px;font-size:.9rem;cursor:pointer;font-family:inherit;">Cancel</button>';
    }

    modal.innerHTML =
        '<div style="background:' + bg + ';border-radius:16px;padding:28px 24px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;font-family:inherit;">' +
        '<h2 style="margin:0 0 4px;font-size:1.25rem;font-weight:900;color:' + textColor + ';">🤖 AI Face Recognition</h2>' +
        '<p style="color:' + subColor + ';margin:0 0 18px;font-size:.87rem;">Person: <strong style="color:' + textColor + ';">' + name + '</strong></p>' +
        ps +
        '<div id="recogResult" style="display:none;margin-bottom:16px;text-align:left;"></div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' + ab + '</div>' +
        '</div>';
    document.body.appendChild(modal);
    if (photoDataURL) modal._photoDataURL = photoDataURL;
}

function autoRecognize() {
    var modal = document.getElementById('recogModal');
    if (!modal || !modal._photoDataURL) return;
    _sendToRecognize(modal._photoDataURL);
}

var _recogStream = null;
function startRecogCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(function(stream){
        _recogStream = stream;
        var video   = document.getElementById('recogVideo');
        var camBtn  = document.getElementById('recogCamBtn');
        var scanBtn = document.getElementById('recogScanBtn');
        var area    = document.getElementById('recogUploadArea');
        video.srcObject = stream;
        video.style.display = 'block';
        area.style.display  = 'none';
        camBtn.style.display  = 'none';
        scanBtn.style.display = 'inline-block';
    }).catch(function(err){ alert('Camera not available: ' + err.message); });
}

function captureAndRecognize() {
    var video  = document.getElementById('recogVideo');
    var canvas = document.getElementById('recogCanvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    _sendToRecognize(canvas.toDataURL('image/jpeg', 0.9));
}

function handleRecogFileSelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    var area = document.getElementById('recogUploadArea');
    var rd   = new FileReader();
    rd.onload = function(e){
        if (area) {
            area.innerHTML = '<img src="' + e.target.result + '" style="max-width:140px;max-height:140px;border-radius:10px;object-fit:cover;border:3px solid #22c55e;"/>' +
                             '<p style="margin:8px 0 0;font-size:.85rem;color:#22c55e;">Photo selected ✓</p>';
        }
        _sendToRecognize(e.target.result);
    };
    rd.readAsDataURL(file);
}

function _sendToRecognize(dataURL) {
    var resultDiv = document.getElementById('recogResult');
    if (!resultDiv) return;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;color:#3b82f6;font-size:.9rem;text-align:center;">⏳ Analyzing… this may take a moment on first run</div>';

    var modal = document.getElementById('recogModal');
    if (modal) modal.querySelectorAll('button').forEach(function(b){ if (b.textContent.indexOf('Cancel') === -1) b.disabled = true; });

    var r = adminReports.find(function(x){ return String(x.id) === String(_recogTargetId); });
    if (r) { r.status = 'Processing'; renderAdminTable(); }

    fetch(API_BASE + '/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
        if (data.error) {
            resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;color:#dc2626;font-size:.9rem;">❌ Error: ' + data.error + '</div>';
            if (r && r.status === 'Processing') { r.status = 'Missing'; renderAdminTable(); }
            if (modal) modal.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
            return;
        }

        if (data.match) {
            // ── Check if Aadhaar numbers are stored on this report ──
            var hasAadhaar = r && (r.famAadhaar || r.perAadhaar);

            resultDiv.innerHTML =
                '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;">' +
                '<div style="color:#16a34a;font-size:1.05rem;font-weight:700;margin-bottom:10px;">✅ Match Found!</div>' +
                '<table style="width:100%;font-size:.88rem;border-collapse:collapse;">' +
                '<tr><td style="color:#64748b;padding:3px 0;">Name</td><td style="font-weight:700;">' + (data.person_name || '—') + '</td></tr>' +
                '<tr><td style="color:#64748b;padding:3px 0;">Inmate ID</td><td style="font-weight:700;">' + (data.person_id || '—') + '</td></tr>' +
                '<tr><td style="color:#64748b;padding:3px 0;">Confidence</td><td><span style="background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:20px;font-weight:700;">' + data.confidence + '%</span></td></tr>' +
                '</table>' +
                (hasAadhaar ? '<button onclick="showAadhaarMatchPopup()" style="margin-top:12px;padding:8px 18px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:.85rem;cursor:pointer;font-weight:700;font-family:inherit;">🪪 View Aadhaar Details</button>' : '') +
                '</div>';

            if (r) { r.status = 'Found'; renderAdminTable(); }
            showToast('Match Found', '✅ ' + data.person_name + ' (' + data.confidence + '%)', 'success');

            // ── Save notification ──
            var notifUserEmail = (r && r.familyEmail) ? r.familyEmail : _getUserNotifKey();
            var notifPayload = {
                type: 'match',
                title: 'Match Found — ' + (data.person_name || 'Unknown'),
                message: 'Face recognition match found for ' + (r ? r.name : 'person') + ' with ' + data.confidence + '% confidence.',
                report_name: r ? r.name : '',
                phone: r ? (r.familyPhone || '') : '',
                read: false,
                user_email: notifUserEmail
            };
            addUserNotification(notifPayload);
            fetch(FLASK_BASE + '/save-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notifPayload)
            }).catch(function(){});

            // ── Auto-show Aadhaar popup if available ──
            if (hasAadhaar) {
                setTimeout(function(){ showAadhaarMatchPopup(); }, 500);
            }

        } else {
            resultDiv.innerHTML =
                '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;">' +
                '<div style="color:#dc2626;font-size:1.05rem;font-weight:700;margin-bottom:8px;">❌ No Match Found</div>' +
                '<p style="color:#64748b;font-size:.88rem;margin:0;">' + (data.message || 'No match found') + '</p>' +
                '</div>';
            if (r && r.status === 'Processing') { r.status = 'Missing'; renderAdminTable(); }
        }
        if (modal) modal.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
    })
    .catch(function(err){
        resultDiv.innerHTML =
            '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;font-size:.88rem;">❌ Network error: ' + err.message +
            '<br><small style="color:#94a3b8;">Make sure the backend server is running.</small></div>';
        if (r && r.status === 'Processing') { r.status = 'Missing'; renderAdminTable(); }
        if (modal) modal.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
    });
}

// ════════════════════════════════════════════════════
// AADHAAR MATCH POPUP
// Shown automatically after a face match when Aadhaar
// numbers are stored on the report.
// ════════════════════════════════════════════════════
function showAadhaarMatchPopup() {
    var r = adminReports.find(function(x){ return String(x.id) === String(_recogTargetId); });

    var old = document.getElementById('aadhaarMatchModal');
    if (old) old.remove();

    var dark       = document.body.classList.contains('dark-mode');
    var bg         = dark ? '#1e293b' : '#fff';
    var textColor  = dark ? '#f1f5f9' : '#0f172a';
    var subColor   = dark ? '#94a3b8' : '#64748b';
    var cardBg     = dark ? '#0d2818' : '#f0fdf4';
    var cardBorder = dark ? '#14532d' : '#bbf7d0';
    var idBg       = dark ? '#1e1b4b' : '#eef2ff';
    var idBorder   = dark ? '#3730a3' : '#c7d2fe';
    var idText     = dark ? '#a5b4fc' : '#3730a3';

    // Mask Aadhaar for privacy: show only last 4 digits
    function maskAadhaar(num) {
        if (!num || num.length < 4) return num || '—';
        return 'XXXX XXXX ' + num.slice(-4);
    }

    var famAadhaar = (r && r.famAadhaar) ? r.famAadhaar : '';
    var perAadhaar = (r && r.perAadhaar) ? r.perAadhaar : '';
    var personName = r ? r.name : 'Unknown';
    var contactName  = r ? (r.familyContactName || 'Family Member') : 'Family Member';
    var contactPhone = r ? (r.familyPhone || '—') : '—';

    // Aadhaar match check: both present → compare
    var bothPresent = famAadhaar && perAadhaar;
    var matched     = bothPresent && (famAadhaar === perAadhaar);

    var matchStatusHtml = '';
    if (bothPresent) {
        matchStatusHtml = matched
            ? '<div style="background:#dcfce7;border:1.5px solid #16a34a;border-radius:8px;padding:10px 14px;margin-top:14px;display:flex;align-items:center;gap:10px;">' +
              '<span style="font-size:1.4rem;">✅</span>' +
              '<div><div style="font-weight:800;color:#15803d;font-size:.92rem;">Aadhaar Numbers Match</div>' +
              '<div style="color:#166534;font-size:.82rem;margin-top:2px;">Identity confirmed — safe to proceed with reunion.</div></div></div>'
            : '<div style="background:#fef9c3;border:1.5px solid #ca8a04;border-radius:8px;padding:10px 14px;margin-top:14px;display:flex;align-items:center;gap:10px;">' +
              '<span style="font-size:1.4rem;">⚠️</span>' +
              '<div><div style="font-weight:800;color:#92400e;font-size:.92rem;">Aadhaar Numbers Do Not Match</div>' +
              '<div style="color:#78350f;font-size:.82rem;margin-top:2px;">Cross-check identity before proceeding.</div></div></div>';
    }

    var aadhaarRows = '';
    if (famAadhaar) {
        aadhaarRows +=
            '<div style="background:' + idBg + ';border:1px solid ' + idBorder + ';border-radius:10px;padding:12px 16px;margin-bottom:10px;">' +
            '<div style="font-size:.75rem;color:' + idText + ';font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">👨‍👩‍👧 Family Aadhaar</div>' +
            '<div style="font-size:1.05rem;font-weight:800;color:' + textColor + ';letter-spacing:2px;">' + maskAadhaar(famAadhaar) + '</div>' +
            '</div>';
    }
    if (perAadhaar) {
        aadhaarRows +=
            '<div style="background:' + idBg + ';border:1px solid ' + idBorder + ';border-radius:10px;padding:12px 16px;margin-bottom:10px;">' +
            '<div style="font-size:.75rem;color:' + idText + ';font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">🧑 Missing Person Aadhaar</div>' +
            '<div style="font-size:1.05rem;font-weight:800;color:' + textColor + ';letter-spacing:2px;">' + maskAadhaar(perAadhaar) + '</div>' +
            '</div>';
    }
    if (!famAadhaar && !perAadhaar) {
        aadhaarRows = '<div style="color:' + subColor + ';font-size:.88rem;text-align:center;padding:12px;">No Aadhaar details stored for this report.</div>';
    }

    var modal = document.createElement('div');
    modal.id = 'aadhaarMatchModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;';
    modal.innerHTML =
        '<div style="background:' + bg + ';border-radius:16px;padding:28px 24px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:inherit;">' +

        // Header
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🪪</div>' +
        '<div><div style="font-weight:900;font-size:1.05rem;color:' + textColor + ';">Aadhaar Verification</div>' +
        '<div style="font-size:.78rem;color:' + subColor + ';">Identity details for ' + personName + '</div></div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'aadhaarMatchModal\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;">×</button>' +
        '</div>' +

        // Match banner
        '<div style="background:' + cardBg + ';border:1px solid ' + cardBorder + ';border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">' +
        '<span style="font-size:1.5rem;">✅</span>' +
        '<div><div style="font-weight:800;color:#16a34a;font-size:.95rem;">Face Match Confirmed</div>' +
        '<div style="color:' + subColor + ';font-size:.82rem;">Reported person: <strong style="color:' + textColor + ';">' + personName + '</strong></div>' +
        '</div></div>' +

        // Aadhaar cards
        '<div style="margin-bottom:4px;">' + aadhaarRows + '</div>' +

        // Aadhaar match status
        matchStatusHtml +

        // Contact info
        '<div style="background:' + (dark ? '#0f1e3d' : '#eff6ff') + ';border:1px solid ' + (dark ? '#1e3a8a' : '#bfdbfe') + ';border-radius:10px;padding:12px 16px;margin-top:14px;">' +
        '<div style="font-weight:700;color:' + (dark ? '#93c5fd' : '#1e40af') + ';margin-bottom:8px;font-size:.9rem;">📞 Family Contact</div>' +
        '<div style="font-size:.88rem;color:' + subColor + ';">Name: <strong style="color:' + textColor + ';">' + contactName + '</strong></div>' +
        '<div style="font-size:.88rem;color:' + subColor + ';margin-top:4px;">Phone: <a href="tel:' + contactPhone + '" style="color:#3b82f6;font-weight:700;text-decoration:none;">' + contactPhone + '</a></div>' +
        '</div>' +

        // Footer buttons
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">' +
        '<button onclick="document.getElementById(\'aadhaarMatchModal\').remove()" style="padding:10px 22px;background:' + (dark ? '#263345' : '#f1f5f9') + ';color:' + (dark ? '#cbd5e1' : '#334155') + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Close</button>' +
        '<button onclick="markAdminFound(\'' + (r ? r.id : '') + '\');document.getElementById(\'aadhaarMatchModal\').remove();closeRecogModal();" style="padding:10px 22px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;">✅ Mark as Found</button>' +
        '</div>' +
        '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
}

function closeRecogModal() {
    if (_recogStream) { _recogStream.getTracks().forEach(function(t){ t.stop(); }); _recogStream = null; }
    var modal = document.getElementById('recogModal');
    if (modal) modal.remove();
    _recogTargetId = null;
}

// ════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════
var currentUserEmail = '';

function openLogin()  { loginModal.style.display = 'flex'; }
function closeLogin() { loginModal.style.display = 'none'; }

function handleLogin() {
    var email = document.getElementById('emailInput').value;
    var pass  = document.getElementById('passInput').value;
    var role  = document.getElementById('roleInput').value;
    if (email !== '' && pass !== '') {
        landingPage.style.display  = 'none';
        loginModal.style.display   = 'none';
        currentUserRole  = role;
        currentUserEmail = email.toLowerCase().trim();
        var displayName  = email.split('@')[0];
        document.querySelectorAll('.displayUserName').forEach(function(el){ el.textContent = displayName; });
        document.querySelectorAll('.displayUserRole').forEach(function(el){
            el.textContent = role === 'Admin' ? 'Administrator' : role === 'Volunteer' ? 'Volunteer' : 'Citizen User';
        });
        showDashboard();
        window.scrollTo(0, 0);
    } else {
        alert('Please enter credentials');
    }
}

function logout() {
    ['adminDashboard','publicDashboard','registerInmatePage','reportLostPage','foundReportPage','mapPage','notificationsPage']
        .forEach(function(id){ var el = document.getElementById(id); if (el) el.style.display = 'none'; });
    currentUserRole  = '';
    currentUserEmail = '';
    if (landingPage) landingPage.style.display = 'block';
    window.scrollTo(0, 0);
}

window.onclick = function(event){ if (event.target === loginModal) closeLogin(); };

// ════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════
function hideAllPages() {
    ['adminDashboard','publicDashboard','reportLostPage','registerInmatePage','foundReportPage','mapPage','notificationsPage']
        .forEach(function(id){ var el = document.getElementById(id); if (el) el.style.display = 'none'; });
}

function showDashboard() {
    hideAllPages();
    if (currentUserRole === 'Public') {
        document.getElementById('publicDashboard').style.display = 'block';
    } else {
        document.getElementById('adminDashboard').style.display = 'block';
        loadAdminReports();
    }
    window.scrollTo(0, 0);
}

function showReportForm() {
    hideAllPages();
    if (currentUserRole === 'Public') {
        document.getElementById('reportLostPage').style.display = 'block';
    } else {
        document.getElementById('registerInmatePage').style.display = 'block';
    }
    window.scrollTo(0, 0);
}

function showFoundReportForm() {
    hideAllPages();
    var fp = document.getElementById('foundReportPage');
    if (fp) fp.style.display = 'block';
    window.scrollTo(0, 0);
}

// ════════════════════════════════════════════════════
// FORM SUBMISSION — PUBLIC: Report Lost Person
// ════════════════════════════════════════════════════
// function submitPublicLostReport() {
//     var fullName     = (document.getElementById('public_fullName')    || {}).value || '';
//     var age          = (document.getElementById('public_age')         || {}).value || '';
//     var gender       = (document.getElementById('gender')             || {}).value || '';
//     var language     = (document.getElementById('language_spoken')    || {}).value || '';
//     var location     = (document.getElementById('public_location')    || {}).value || '';
//     var dateTime     = (document.getElementById('public_dateTime')    || {}).value || '';
//     var clothing     = (document.getElementById('clothing_description')|| {}).value || '';
//     var general      = (document.getElementById('general_description') || {}).value || '';
//     var medical      = (document.getElementById('medical_condition')  || {}).value || '';
//     var familyName   = (document.getElementById('public_familyName')  || {}).value || '';
//     var familyPhone  = (document.getElementById('public_familyPhone') || {}).value || '';
//     var familyEmail  = (document.getElementById('public-familyEmail') || {}).value || '';
//     var famAadhaar   = (document.getElementById('public-familyAadhaar')|| {}).value || '';
//     var perAadhaar   = (document.getElementById('public-personAadhaar')|| {}).value || '';

//     // ── Required field validation ──
//     if (!fullName.trim())    { alert('Please enter the full name.');              return; }
//     if (!age)                { alert('Please enter the age.');                    return; }
//     if (!location.trim())    { alert('Please enter the last seen location.');     return; }
//     if (!dateTime)           { alert('Please enter the last seen date & time.');  return; }
//     if (!familyName.trim())  { alert('Please enter the family contact name.');   return; }
//     if (!familyPhone.trim()) { alert('Please enter the family phone number.');   return; }

//     // ── Phone validation ──
//     var phoneDigits = familyPhone.replace(/\D/g, '');
//     if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
//         alert('Please enter a valid Indian phone number (10 digits, starts with 6–9).');
//         return;
//     }

//     // ── Aadhaar validation (if provided) ──
//     if (famAadhaar && !/^[2-9]\d{11}$/.test(famAadhaar)) {
//         alert('Family Aadhaar number is invalid. It must be 12 digits and not start with 0 or 1.');
//         return;
//     }
//     if (perAadhaar && !/^[2-9]\d{11}$/.test(perAadhaar)) {
//         alert('Missing person Aadhaar number is invalid. It must be 12 digits and not start with 0 or 1.');
//         return;
//     }

//     // ── Date validation ──
//     if (new Date(dateTime) > new Date()) {
//         alert('Last seen date & time cannot be in the future.');
//         return;
//     }

//     // ── Build FormData ──
//     var btn = document.getElementById('public-submit-btn');
//     if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

//     var formData = new FormData();
//     formData.append('public-fullName',    fullName);
//     formData.append('public-age',         age);
//     formData.append('gender',             gender);
//     formData.append('language_spoken',    language);
//     formData.append('public-location',    location);
//     formData.append('public-dateTime',    dateTime);
//     formData.append('clothing_description', clothing);
//     formData.append('general_description',  general);
//     formData.append('medical_condition',    medical);
//     formData.append('public-familyName',  familyName);
//     formData.append('public-familyPhone', phoneDigits);
//     formData.append('contact_email',      familyEmail);
//     formData.append('family_aadhaar',     famAadhaar);
//     formData.append('person_aadhaar',     perAadhaar);

//     // ── Attach photo if selected ──
//     var photoInput = document.getElementById('publicPhotoInput');
//     if (photoInput && photoInput.files.length > 0) {
//         formData.append('photo', photoInput.files[0]);
//     }

//     fetch(FLASK_BASE + '/submit', { method: 'POST', body: formData })
//     .then(function(res){ return res.json(); })
//     .then(function(data){
//         if (btn) { btn.disabled = false; btn.textContent = 'Submit Lost Person Report'; }
//         if (data.error) { alert('Error: ' + data.error); return; }

//         // ── If Aadhaar entered, show Aadhaar confirmation popup ──
//         if (famAadhaar || perAadhaar) {
//             _showAadhaarSubmitConfirmation(fullName, famAadhaar, perAadhaar, familyName, phoneDigits);
//         } else {
//             showToast('Report Submitted', '✅ Lost person report submitted successfully!', 'success');
//             showDashboard();
//         }

//         // ── Add a local notification ──
//         addUserNotification({
//             type: 'update',
//             title: 'Report Submitted — ' + fullName,
//             message: 'Your report for ' + fullName + ' has been submitted. You will be notified if a match is found.',
//             report_name: fullName,
//             phone: phoneDigits
//         });
//     })
//     .catch(function(err){
//         if (btn) { btn.disabled = false; btn.textContent = 'Submit Lost Person Report'; }
//         alert('Network error: ' + err.message + '\nMake sure the server is running.');
//     });
// }

// // ── Shown to public user after successful submit with Aadhaar ──
// function _showAadhaarSubmitConfirmation(personName, famAadhaar, perAadhaar, familyName, phone) {
//     function mask(n){ return n ? 'XXXX XXXX ' + n.slice(-4) : '—'; }

//     var dark       = document.body.classList.contains('dark-mode');
//     var bg         = dark ? '#1e293b' : '#fff';
//     var textColor  = dark ? '#f1f5f9' : '#0f172a';
//     var subColor   = dark ? '#94a3b8' : '#64748b';
//     var idBg       = dark ? '#1e1b4b' : '#eef2ff';
//     var idBorder   = dark ? '#3730a3' : '#c7d2fe';
//     var idText     = dark ? '#a5b4fc' : '#3730a3';

//     var old = document.getElementById('aadhaarSubmitModal');
//     if (old) old.remove();

//     var modal = document.createElement('div');
//     modal.id  = 'aadhaarSubmitModal';
//     modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;';
//     modal.innerHTML =
//         '<div style="background:' + bg + ';border-radius:16px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:inherit;">' +
//         '<div style="text-align:center;margin-bottom:18px;">' +
//         '<div style="font-size:2.5rem;margin-bottom:8px;">✅</div>' +
//         '<h2 style="margin:0 0 4px;font-size:1.1rem;font-weight:900;color:' + textColor + ';">Report Submitted Successfully</h2>' +
//         '<p style="color:' + subColor + ';font-size:.85rem;margin:0;">Aadhaar details saved securely for identity verification.</p>' +
//         '</div>' +

//         '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-bottom:12px;">' +
//         '<div style="font-weight:700;color:#15803d;margin-bottom:8px;font-size:.9rem;">📋 Report For: ' + personName + '</div>' +
//         '</div>' +

//         (famAadhaar ? '<div style="background:' + idBg + ';border:1px solid ' + idBorder + ';border-radius:10px;padding:12px 16px;margin-bottom:10px;">' +
//         '<div style="font-size:.73rem;color:' + idText + ';font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">👨‍👩‍👧 Your (Family) Aadhaar Stored</div>' +
//         '<div style="font-size:1rem;font-weight:800;color:' + textColor + ';letter-spacing:2px;">' + mask(famAadhaar) + '</div>' +
//         '</div>' : '') +

//         (perAadhaar ? '<div style="background:' + idBg + ';border:1px solid ' + idBorder + ';border-radius:10px;padding:12px 16px;margin-bottom:10px;">' +
//         '<div style="font-size:.73rem;color:' + idText + ';font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">🧑 Missing Person Aadhaar Stored</div>' +
//         '<div style="font-size:1rem;font-weight:800;color:' + textColor + ';letter-spacing:2px;">' + mask(perAadhaar) + '</div>' +
//         '</div>' : '') +

//         '<div style="background:' + (dark?'#0f1e3d':'#eff6ff') + ';border:1px solid ' + (dark?'#1e3a8a':'#bfdbfe') + ';border-radius:10px;padding:12px 16px;margin-bottom:16px;">' +
//         '<div style="font-size:.82rem;color:' + subColor + ';">Notification will be sent to: <strong style="color:' + textColor + ';">' + phone + '</strong></div>' +
//         '</div>' +

//         '<button onclick="document.getElementById(\'aadhaarSubmitModal\').remove();showDashboard();" ' +
//         'style="width:100%;padding:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;">Go to Dashboard</button>' +
//         '</div>';
//     document.body.appendChild(modal);
//     modal.addEventListener('click', function(e){ if (e.target === modal) { modal.remove(); showDashboard(); } });
// }

// ════════════════════════════════════════════════════
// FORM SUBMISSION — ADMIN: Register Inmate
// ════════════════════════════════════════════════════
// function submitAdminInmateReport() {
//     var inmateId   = (document.getElementById('admin-inmateId')    || {}).value || '';
//     var regNo      = (document.getElementById('admin-regNo')       || {}).value || '';
//     var fullName   = (document.getElementById('admin-fullName')    || {}).value || '';
//     var dob        = (document.getElementById('admin-dob')         || {}).value || '';
//     var gender     = (document.getElementById('admin-gender')      || {}).value || '';
//     var languages  = (document.getElementById('admin-languages')   || {}).value || '';
//     var address    = (document.getElementById('admin-address')     || {}).value || '';
//     var status     = (document.getElementById('admin-status')      || {}).value || '';
//     var joiningDate= (document.getElementById('admin-joiningDate') || {}).value || '';

//     if (!inmateId.trim())  { alert('Please enter Inmate ID.');   return; }
//     if (!fullName.trim())  { alert('Please enter Full Name.');   return; }
//     if (!gender)           { alert('Please select Gender.');     return; }
//     if (!joiningDate)      { alert('Please enter Date of Joining.'); return; }

//     var btn = document.getElementById('admin-submit-btn');
//     if (btn) { btn.disabled = true; btn.textContent = 'Registering…'; }

//     var formData = new FormData();
//     formData.append('inmate_id',       inmateId);
//     formData.append('reg_no',          regNo);
//     formData.append('public-fullName', fullName);
//     formData.append('gender',          gender);
//     formData.append('language_spoken', languages);
//     formData.append('address',         address);
//     formData.append('admin-status',    status);
//     formData.append('joining_date',    joiningDate);
//     if (dob) formData.append('dob',    dob);

//     var photoInput = document.getElementById('adminPhotoInput');
//     if (photoInput && photoInput.files.length > 0) {
//         formData.append('photo', photoInput.files[0]);
//     }

//     fetch(FLASK_BASE + '/submit-inmate', { method: 'POST', body: formData })
//     .then(function(res){ return res.json(); })
//     .then(function(data){
//         if (btn) { btn.disabled = false; btn.textContent = 'Confirm Registration'; }
//         if (data.error) { alert('Error: ' + data.error); return; }
//         showToast('Inmate Registered', '✅ ' + fullName + ' registered successfully!', 'success');
//         showDashboard();
//     })
//     .catch(function(err){
//         if (btn) { btn.disabled = false; btn.textContent = 'Confirm Registration'; }
//         // Graceful offline fallback
//         showToast('Registered (Offline)', '✅ ' + fullName + ' saved locally.', 'success');
//         showDashboard();
//         console.warn('Server not reachable:', err.message);
//     });
// }

// // ════════════════════════════════════════════════════
// // FORM SUBMISSION — Found Family Report
// // ════════════════════════════════════════════════════
// function submitFoundReport() {
//     var loc   = (document.getElementById('foundLocation') || {}).value || '';
//     var phone = (document.getElementById('contact_phone') || {}).value || '';
//     if (!loc || !phone) { alert('Please provide location and contact number.'); return; }
//     alert('Found Family Report submitted successfully!');
//     showDashboard();
// }

function submitPublicLostReport() {

    const photoFiles = document.getElementById('publicPhotoInput').files;

    if (photoFiles.length === 0) {
        alert("Please upload at least one photo of the lost person.");
        return;
    }

    const lostPersonData = {
        public_fullName: document.getElementById('public_fullName').value,
        public_age: document.getElementById('public_age').value,
        gender: document.getElementById('gender').value,
        language_spoken: document.getElementById('language_spoken').value,
        public_location: document.getElementById('public_location').value,
        public_dateTime: document.getElementById('public_dateTime').value,
        clothing_description: document.getElementById('clothing_description').value,
        general_description: document.getElementById('general_description').value,
        public_familyName: document.getElementById('public_familyName').value,
        public_familyPhone: document.getElementById('public_familyPhone').value,
    };

    // Basic validation
    if (!lostPersonData.public_fullName || !lostPersonData.public_familyPhone) {
        alert("Please provide name and contact number.");
        return;
    }

    // Store in frontend (temporary)
    adminReports.push({
        id: adminReports.length + 1,
        name: lostPersonData.public_fullName,
        age: lostPersonData.public_age || '—',
        gender: lostPersonData.gender || 'Unknown',
        loc: lostPersonData.public_location || '—',
        date: new Date().toISOString().slice(0, 10),
        status: 'Missing',
        photo: null
    });

    console.log("Frontend Data:", lostPersonData);

    alert("Lost Person Report Submitted Successfully!");

    showDashboard();
}



// ════════════════════════════════════════════════════
// FILE UPLOAD
// ════════════════════════════════════════════════════
function triggerFileInput(role) {
    document.getElementById(role === 'admin' ? 'adminPhotoInput' : 'publicPhotoInput').click();
}

function handleFileSelect(event) {
    var input      = event.target;
    var files      = input.files;
    var isAdmin    = input.id === 'adminPhotoInput';
    var uploadText = document.getElementById(isAdmin ? 'uploadTextAdmin' : 'uploadTextPublic');
    if (files.length === 0) {
        uploadText.innerText = 'Click to upload photos';
        uploadText.style.color = '';
        input._previewDataURL = null;
        return;
    }
    uploadText.innerText = files.length + ' photo(s) selected';
    uploadText.style.color = '#22c55e';
    var rd = new FileReader();
    rd.onload = function(e){
        input._previewDataURL = e.target.result;
        var ub  = input.closest('.upload-box') || input.parentElement;
        if (!ub) return;
        var ex  = ub.querySelector('.upload-thumb');
        if (ex) ex.remove();
        var img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'upload-thumb';
        img.style.cssText = 'max-width:130px;max-height:130px;border-radius:10px;margin:10px auto 0;object-fit:cover;display:block;border:3px solid #22c55e;';
        ub.appendChild(img);
    };
    rd.readAsDataURL(files[0]);
}

// ════════════════════════════════════════════════════
// AADHAAR LIVE VALIDATION
// ════════════════════════════════════════════════════
function toggleAadhaarFields(checked) {
    var f = document.getElementById('aadhaarFields');
    if (f) f.style.display = checked ? 'block' : 'none';
}

function liveValidateAadhaar(value, statusId) {
    var el     = document.getElementById(statusId);
    var iconEl = document.getElementById(statusId.replace('status', 'icon'));
    if (!el) return;

    if (value.length === 0) {
        el.textContent = ''; el.style.color = '#94a3b8';
        if (iconEl) iconEl.textContent = '';
        return;
    }
    if (value.length < 12) {
        el.textContent   = (12 - value.length) + ' more digit' + (12 - value.length > 1 ? 's' : '');
        el.style.color   = '#94a3b8';
        if (iconEl) iconEl.textContent = '';
        return;
    }
    // Exactly 12 digits — check first digit
    if (value[0] === '0' || value[0] === '1') {
        el.textContent = '✗ Invalid — cannot start with 0 or 1';
        el.style.color = '#ef4444';
        if (iconEl) iconEl.textContent = '❌';
        return;
    }
    el.textContent = '✓ Valid format';
    el.style.color = '#22c55e';
    if (iconEl) iconEl.textContent = '✅';
}

// ════════════════════════════════════════════════════
// MAP
// ════════════════════════════════════════════════════
let map, mapInitialized = false, searchMarkers = [];

const manualNGOs = [
    // ── DELHI / NCR ──
    {name:"Goonj",city:"Delhi",lat:28.5282,lng:77.2191,address:"L-58, Kalkaji, New Delhi 110019",phone:"+91-11-26232484"},
    {name:"The Smile Foundation",city:"Delhi",lat:28.6139,lng:77.2090,address:"Connaught Place, New Delhi 110001",phone:"+91-11-43123700"},
    {name:"Salaam Baalak Trust",city:"Delhi",lat:28.6428,lng:77.2197,address:"Paharganj, New Delhi 110055",phone:"+91-11-23581054"},
    {name:"Butterflies NGO",city:"Delhi",lat:28.6562,lng:77.2410,address:"Yamuna Bazar, New Delhi 110006",phone:"+91-11-23867723"},
    {name:"Prayas Juvenile Aid Centre",city:"Delhi",lat:28.6271,lng:77.2197,address:"Connaught Place Area, New Delhi 110001",phone:"+91-11-23324603"},
    {name:"Don Bosco Ashalayam",city:"Delhi",lat:28.6315,lng:77.2167,address:"Okhla Phase-I, New Delhi 110020",phone:"+91-11-29956591"},
    {name:"CRY India (Delhi Office)",city:"Delhi",lat:28.5921,lng:77.2291,address:"Nehru Place, New Delhi 110019",phone:"+91-11-26459226"},
    {name:"HelpAge India (HQ)",city:"Delhi",lat:28.5672,lng:77.2100,address:"Lajpat Nagar, New Delhi 110024",phone:"+91-11-46060530"},
    {name:"Udayan Care",city:"Delhi",lat:28.5274,lng:77.2812,address:"Saket, New Delhi 110017",phone:"+91-11-26531817"},
    {name:"Salam Balak Trust — Railway Station",city:"Delhi",lat:28.6417,lng:77.2195,address:"New Delhi Railway Station, Paharganj 110055",phone:"+91-11-23581054"},
    {name:"Deepalaya",city:"Delhi",lat:28.6890,lng:77.1620,address:"Kingsway Camp, New Delhi 110009",phone:"+91-11-27662024"},
    {name:"Jan Sahas",city:"Delhi",lat:28.6280,lng:77.3649,address:"Mayur Vihar, New Delhi 110091",phone:"+91-11-22754500"},
    {name:"Asha for Education Delhi",city:"Delhi",lat:28.6127,lng:77.2311,address:"IIT Delhi Campus, Hauz Khas 110016",phone:"+91-11-26591715"},
    {name:"Society for Participatory Research in Asia",city:"Delhi",lat:28.6356,lng:77.2845,address:"Preet Vihar, New Delhi 110092",phone:"+91-11-22527764"},
    {name:"Mobile Creches",city:"Delhi",lat:28.5665,lng:77.2060,address:"Malviya Nagar, New Delhi 110017",phone:"+91-11-29233575"},
    {name:"CHETNA (Child & Environment)",city:"Delhi",lat:28.6741,lng:77.1135,address:"Rohini Sector 8, New Delhi 110085",phone:"+91-11-27942090"},
    {name:"Save the Children India — Delhi",city:"Delhi",lat:28.5496,lng:77.2513,address:"Greater Kailash II, New Delhi 110048",phone:"+91-11-40624444"},
    {name:"Navjyoti India Foundation",city:"Delhi",lat:28.7041,lng:77.1025,address:"Rohini, New Delhi 110085",phone:"+91-11-27051027"},
    {name:"AASRA Delhi",city:"Delhi",lat:28.6303,lng:77.2177,address:"Karol Bagh, New Delhi 110005",phone:"+91-22-27546669"},
    {name:"iCall — NIMHANS Delhi Centre",city:"Delhi",lat:28.6448,lng:77.2167,address:"Old Rajinder Nagar, New Delhi 110060",phone:"+91-9152987821"},
    // ── MUMBAI ──
    {name:"Pratham Mumbai",city:"Mumbai",lat:19.0760,lng:72.8777,address:"Azad Maidan, Fort, Mumbai 400001",phone:"+91-22-66326565"},
    {name:"iCall — TISS Mumbai",city:"Mumbai",lat:19.0218,lng:72.8677,address:"Deonar, Mumbai 400088",phone:"+91-9152987821"},
    {name:"Aseema Charitable Trust",city:"Mumbai",lat:19.0550,lng:72.8351,address:"Dharavi, Mumbai 400017",phone:"+91-22-24044555"},
    {name:"Snehasadan",city:"Mumbai",lat:19.0728,lng:72.8826,address:"Byculla, Mumbai 400027",phone:"+91-22-23027595"},
    // ── BENGALURU ──
    {name:"Akshaya Patra Foundation",city:"Bengaluru",lat:13.0645,lng:77.5348,address:"Vasanthapura, Bengaluru 560062",phone:"+91-80-30143400"},
    {name:"Samarthanam Trust",city:"Bengaluru",lat:12.9716,lng:77.5946,address:"JP Nagar, Bengaluru 560078",phone:"+91-80-25731900"},
    // ── CHENNAI ──
    {name:"Hope Foundation Chennai",city:"Chennai",lat:13.0827,lng:80.2707,address:"RA Puram, Chennai 600028",phone:"+91-44-24351777"},
    {name:"SNEHA India",city:"Chennai",lat:13.0500,lng:80.2122,address:"Sowcarpet, Chennai 600079",phone:"+91-44-24640050"},
    // ── KOLKATA ──
    {name:"Missionaries of Charity",city:"Kolkata",lat:22.5558,lng:88.3476,address:"54A, AJC Bose Road, Kolkata 700016",phone:"+91-33-22491115"},
    {name:"CINI (Child in Need Institute)",city:"Kolkata",lat:22.5204,lng:88.3378,address:"Alipur, Kolkata 700053",phone:"+91-33-24013986"},
    // ── HYDERABAD ──
    {name:"Prayas Centre Hyderabad",city:"Hyderabad",lat:17.3850,lng:78.4867,address:"Secunderabad, Hyderabad 500003",phone:"+91-40-27843666"},
    // ── BHARATPUR ──
    {name:"Apna Ghar Organisation",city:"Bharatpur",lat:27.2173,lng:77.4895,address:"Village Bajhera, Achhnera Road, Bharatpur, Rajasthan 321001",phone:"+91-8599999911",email:"hq@apnagharashram.org"},
];

async function searchNearby() {
    if (!mapInitialized) { alert('Map not ready yet'); return; }
    var input = document.getElementById('mapSearchInput').value.trim();
    if (!input) { alert('Please enter a city name'); return; }
    searchMarkers.forEach(function(m){ map.removeLayer(m); }); searchMarkers = [];
    try {
        var res  = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(input + ' India') + '&format=json&limit=1');
        var data = await res.json();
        if (data.length > 0) {
            map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12);
            searchNGOsNearLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), input);
        } else { alert('Location "' + input + '" not found.'); }
    } catch(e) { alert('Error searching location.'); }
}

async function searchNGOsNearLocation(lat, lon, cityName) {
    try {
        var matches = manualNGOs.filter(function(n){
            return n.city.toLowerCase().includes(cityName.toLowerCase()) ||
                   cityName.toLowerCase().includes(n.city.toLowerCase());
        });
        var greenIcon = L.icon({
            iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
        });
        matches.forEach(function(ngo){
            var mk = L.marker([ngo.lat, ngo.lng], { icon: greenIcon }).addTo(map);
            mk.bindPopup(buildNGOPopup(ngo));
            searchMarkers.push(mk);
        });
        var countEl = document.getElementById('ngoCount');
        if (countEl) countEl.textContent = matches.length || '—';
        var listEl = document.getElementById('nearbyNGOList');
        if (listEl) {
            listEl.innerHTML = '';
            if (matches.length === 0) {
                listEl.innerHTML = '<div class="nearby-ngo-empty"><i class="fas fa-search"></i><p>No NGOs found in ' + cityName + '.<br>Try a nearby city.</p></div>';
            } else {
                matches.forEach(function(ngo){
                    var dist = (_userLat && _userLng) ? haversineKm(_userLat, _userLng, ngo.lat, ngo.lng).toFixed(1) + ' km' : '—';
                    var item = document.createElement('div');
                    item.className = 'ngo-list-item';
                    item.innerHTML = '<div class="ngo-list-icon"><i class="fas fa-hands-helping"></i></div>' +
                        '<div class="ngo-list-info"><div class="ngo-list-name">' + ngo.name + '</div>' +
                        '<div class="ngo-list-city"><i class="fas fa-map-marker-alt"></i> ' + ngo.city + ' &nbsp;·&nbsp; ' + dist + '</div></div>' +
                        '<button class="ngo-list-route-btn" title="Get Directions" onclick="map.setView([' + ngo.lat + ',' + ngo.lng + '],15);setTimeout(function(){drawRouteTo(' + ngo.lat + ',' + ngo.lng + ',\'' + ngo.name.replace(/'/g, '\\\'') + '\')},200)"><i class="fas fa-route"></i></button>';
                    listEl.appendChild(item);
                });
            }
        }
        if (matches.length > 0 && searchMarkers.length > 0) searchMarkers[0].openPopup();
    } catch(e) { console.error('NGO search error', e); }
}

function handleMapNavigation() {
    if (landingPage)        landingPage.style.display        = 'none';
    if (loginModal)         loginModal.style.display         = 'none';
    if (adminDashboard)     adminDashboard.style.display     = 'none';
    if (publicDashboard)    publicDashboard.style.display    = 'none';
    if (foundReportPage)    foundReportPage.style.display    = 'none';
    if (notificationsPage)  notificationsPage.style.display  = 'none';
    if (!mapPage) { mapPage = document.getElementById('mapPage'); }
    if (mapPage) mapPage.style.display = 'block';
    setTimeout(function(){
        if (!mapInitialized) { initMap(); }
        else { map.invalidateSize(); if (typeof updateNearbyNGOList === 'function') updateNearbyNGOList(); }
    }, 300);
}

function showMap() {
    hideAllPages();
    if (!mapPage) { mapPage = document.getElementById('mapPage'); }
    if (mapPage) mapPage.style.display = 'block';
    setTimeout(function(){
        if (!mapInitialized) { initMap(); }
        else { map.invalidateSize(); if (typeof updateNearbyNGOList === 'function') updateNearbyNGOList(); }
    }, 300);
}

// ════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════
let notifications = [];
var _localNotifStore = {};

function _getUserNotifKey() { return currentUserEmail || 'guest'; }

function loadNotifications() {
    fetch(FLASK_BASE + '/get-notifications?user=' + encodeURIComponent(_getUserNotifKey()))
    .then(function(res){ return res.json(); })
    .then(function(data){
        notifications = data
            .filter(function(n){ return !n.user_email || n.user_email === _getUserNotifKey() || currentUserRole === 'Admin'; })
            .map(function(n){
                return { id:n._id, type:n.type||'match', title:n.title||'Match Found', message:n.message||'', time:n.time||'Just now', read:n.read||false, reportName:n.report_name||'', phone:n.phone||'', userEmail:n.user_email||'' };
            });
        renderNotifications(); updateNotificationBadge();
    })
    .catch(function(){
        notifications = (_localNotifStore[_getUserNotifKey()] || []);
        renderNotifications(); updateNotificationBadge();
    });
}

function addUserNotification(notif) {
    var key = _getUserNotifKey();
    if (!_localNotifStore[key]) _localNotifStore[key] = [];
    notif.id        = Date.now().toString();
    notif.userEmail = key;
    notif.time      = new Date().toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' });
    notif.read      = false;
    _localNotifStore[key].unshift(notif);
    fetch(FLASK_BASE + '/save-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, notif, { user_email: key }))
    }).catch(function(){});
    updateNotificationBadge();
}

function showNotifications() { hideAllPages(); notificationsPage.style.display = 'block'; loadNotifications(); window.scrollTo(0, 0); }

function renderNotifications(filter) {
    filter = filter || 'all';
    var list = document.getElementById('notificationsList');
    if (!list) return;
    list.innerHTML = '';
    var userNotifs = notifications.filter(function(n){
        return !n.userEmail || n.userEmail === _getUserNotifKey() || currentUserRole === 'Admin';
    });
    var filtered = filter === 'all' ? userNotifs : userNotifs.filter(function(n){ return n.type === filter; });
    if (!filtered.length) {
        var userName = currentUserEmail ? currentUserEmail.split('@')[0] : 'you';
        list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#94a3b8;">' +
            '<i class="fas fa-bell-slash" style="font-size:4rem;margin-bottom:20px;display:block;opacity:.4;"></i>' +
            '<p style="font-size:1.1rem;font-weight:700;color:#64748b;">No notifications for ' + userName + '</p>' +
            '<p style="font-size:.88rem;margin-top:8px;">You\'ll be notified here when a match is found for your reports.</p></div>';
        return;
    }
    filtered.forEach(function(notif){
        var card = document.createElement('div');
        card.className = 'notification-card ' + (notif.read ? '' : 'unread') + ' ' + notif.type + '-found';
        card.innerHTML =
            '<div style="display:flex;gap:15px;">' +
            '<div class="notification-icon ' + notif.type + '"><i class="fas ' + (notif.type === 'match' ? 'fa-check-circle' : notif.type === 'update' ? 'fa-info-circle' : 'fa-bell') + '"></i></div>' +
            '<div class="notification-content">' +
            '<div class="notification-header-row"><div>' +
            '<div class="notification-title">' + notif.title + '</div>' +
            '<div class="notification-message">' + notif.message + '</div>' +
            '</div></div>' +
            '<div class="notification-meta">' +
            '<span><i class="far fa-clock"></i> ' + notif.time + '</span>' +
            (notif.read ? '<span style="color:#22c55e;"><i class="fas fa-check"></i> Read</span>' : '<span style="color:#f97316;font-weight:700;">● Unread</span>') +
            '</div>' +
            '<div class="notification-actions">' +
            '<button class="notif-action-btn notif-view-btn" onclick="viewNotificationDetails(\'' + notif.id + '\')"><i class="fas fa-eye"></i> View Details</button>' +
            '<button class="notif-action-btn notif-dismiss-btn" onclick="dismissNotification(\'' + notif.id + '\')"><i class="fas fa-times"></i> Dismiss</button>' +
            '</div></div></div>';
        list.appendChild(card);
    });
    updateNotificationBadge();
}

function filterNotifications(type) {
    document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
    event.target.classList.add('active');
    renderNotifications(type);
}

function markAllAsRead() {
    notifications.forEach(function(n){
        if (!n.read) {
            n.read = true;
            fetch(FLASK_BASE + '/mark-notification-read/' + n.id, { method: 'POST' }).catch(function(){});
        }
    });
    renderNotifications(); updateNotificationBadge();
}

function viewNotificationDetails(id) {
    var notif = notifications.find(function(n){ return n.id === id; });
    if (!notif) return;
    fetch(FLASK_BASE + '/mark-notification-read/' + id, { method: 'POST' }).catch(function(){});
    notif.read = true; updateNotificationBadge();

    var old = document.getElementById('notifDetailModal');
    if (old) old.remove();
    var dark         = document.body.classList.contains('dark-mode');
    var bg           = dark ? '#1e293b' : '#fff';
    var textColor    = dark ? '#f1f5f9' : '#0f172a';
    var subColor     = dark ? '#94a3b8' : '#64748b';
    var matchBg      = dark ? '#0d2818' : '#f0fdf4';
    var matchBorder  = dark ? '#14532d' : '#bbf7d0';
    var contactBg    = dark ? '#0f1e3d' : '#eff6ff';
    var contactBorder= dark ? '#1e3a8a' : '#bfdbfe';
    var contactTitle = dark ? '#93c5fd' : '#1e40af';
    var contactText  = dark ? '#cbd5e1' : '#334155';
    var closeBg      = dark ? '#263345' : '#f1f5f9';
    var closeColor   = dark ? '#94a3b8' : '#334155';

    var modal = document.createElement('div');
    modal.id = 'notifDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
    modal.innerHTML =
        '<div style="background:' + bg + ';border-radius:16px;padding:28px 24px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:inherit;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h2 style="margin:0;font-size:1.15rem;font-weight:900;color:' + textColor + ';">🔔 Notification Details</h2>' +
        '<button onclick="document.getElementById(\'notifDetailModal\').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8;">×</button></div>' +
        '<div style="background:' + matchBg + ';border:1px solid ' + matchBorder + ';border-radius:10px;padding:16px;margin-bottom:16px;">' +
        '<div style="color:#16a34a;font-weight:800;margin-bottom:8px;">✅ ' + notif.title + '</div>' +
        '<p style="color:' + contactText + ';font-size:.9rem;margin:0 0 10px;line-height:1.5;">' + notif.message + '</p>' +
        '<div style="font-size:.82rem;color:' + subColor + ';">🕐 ' + notif.time + '</div></div>' +
        (notif.phone ? '<div style="background:' + contactBg + ';border:1px solid ' + contactBorder + ';border-radius:10px;padding:14px;margin-bottom:16px;">' +
        '<div style="font-weight:700;color:' + contactTitle + ';margin-bottom:8px;">📞 Family Contact</div>' +
        (notif.reportName ? '<div style="font-size:.9rem;margin-bottom:4px;color:' + contactText + ';">Name: <strong>' + notif.reportName + '</strong></div>' : '') +
        '<div style="font-size:.9rem;color:' + contactText + ';">Phone: <strong>' + notif.phone + '</strong></div></div>' : '') +
        '<div style="display:flex;justify-content:flex-end;">' +
        '<button onclick="document.getElementById(\'notifDetailModal\').remove()" style="padding:10px 24px;background:' + closeBg + ';color:' + closeColor + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Close</button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    renderNotifications();
}

function dismissNotification(id) {
    notifications = notifications.filter(function(n){ return n.id !== id; });
    fetch(FLASK_BASE + '/delete-notification/' + id, { method: 'DELETE' }).catch(function(){});
    renderNotifications();
}

function updateNotificationBadge() {
    var unread = notifications.filter(function(n){
        return !n.read && (!n.userEmail || n.userEmail === _getUserNotifKey() || currentUserRole === 'Admin');
    }).length;
    document.querySelectorAll('.notif-badge').forEach(function(b){
        b.textContent    = unread > 0 ? unread : '0';
        b.style.display  = unread > 0 ? 'inline' : 'none';
    });
}

function showToast(title, message, type) {
    type = type || 'success';
    var container = document.getElementById('notificationToast');
    if (!container) return;
    container.style.display = 'block';
    var toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML =
        '<div class="toast-icon"><i class="fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-info-circle') + '"></i></div>' +
        '<div class="toast-content"><div class="toast-title">' + title + '</div><div class="toast-message">' + message + '</div></div>' +
        '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    setTimeout(function(){
        toast.style.animation = 'slideIn .3s ease-out reverse';
        setTimeout(function(){ toast.remove(); }, 300);
    }, 5000);
}

function closeSMSModal() { var m = document.getElementById('smsModal'); if (m) m.style.display = 'none'; }

// ════════════════════════════════════════════════════
// HELP CENTER
// ════════════════════════════════════════════════════
function openHelpCenter()  { var m = document.getElementById('helpCenterModal'); if (m) m.style.display = 'flex'; }
function closeHelpCenter() { var m = document.getElementById('helpCenterModal'); if (m) m.style.display = 'none'; }

// ════════════════════════════════════════════════════
// DARK MODE
// ════════════════════════════════════════════════════
function toggleDarkMode() {
    var isDark = document.body.classList.toggle('dark-mode');
    var icon   = document.getElementById('darkModeIcon');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    try { localStorage.setItem('darkMode', isDark ? 'on' : 'off'); } catch(e){}
}

(function(){
    try {
        if (localStorage.getItem('darkMode') === 'on') {
            document.body.classList.add('dark-mode');
            var icon = document.getElementById('darkModeIcon');
            if (icon) icon.className = 'fas fa-sun';
        }
    } catch(e){}
})();

// ════════════════════════════════════════════════════
// MAP — Live location, sidebar, route, layer, NGO list
// ════════════════════════════════════════════════════
var _userLat = null, _userLng = null;
var _userMarker = null, _routeLayer = null, _straightLine = null;
var _currentTileLayer = null, _altTileLayer = null, _usingAlt = false;
var _liveWatchId = null;

function startLiveLocation() {
    var statusBar = document.getElementById('liveLocationStatus');
    if (!navigator.geolocation) {
        if (statusBar) { statusBar.className = 'live-status-bar live-status-error'; statusBar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> &nbsp;Geolocation not supported by your browser.'; }
        return;
    }
    _liveWatchId = navigator.geolocation.watchPosition(
        function(pos) {
            _userLat = pos.coords.latitude;
            _userLng = pos.coords.longitude;
            var acc  = Math.round(pos.coords.accuracy);
            if (statusBar) { statusBar.className = 'live-status-bar live-status-ok'; statusBar.innerHTML = '<i class="fas fa-circle" style="color:#22c55e;font-size:.55rem;vertical-align:middle;"></i> &nbsp;Live location active &nbsp;·&nbsp; Accuracy ±' + acc + 'm'; }
            updateSidebarLocation(_userLat, _userLng);
            placeUserMarker(_userLat, _userLng);
        },
        function() {
            if (statusBar) { statusBar.className = 'live-status-bar live-status-error'; statusBar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> &nbsp;Location access denied. Enable GPS to use live features.'; }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
}

function placeUserMarker(lat, lng) {
    if (!map) return;
    var blueIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,.6);"></div>',
        iconSize: [16,16], iconAnchor: [8,8]
    });
    if (_userMarker) { _userMarker.setLatLng([lat, lng]); }
    else { _userMarker = L.marker([lat, lng], { icon: blueIcon }).addTo(map); _userMarker.bindPopup('<b>📍 You are here</b><br><span style="font-size:11px;color:#64748b;">Fetching address…</span>'); }
}

function updateSidebarLocation(lat, lng) {
    var coordEl = document.getElementById('sidebarCoords');
    if (coordEl) coordEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json')
    .then(function(r){ return r.json(); })
    .then(function(d){
        if (!d.display_name) return;
        var parts = d.display_name.split(',');
        var short = parts.slice(0, 3).join(',').trim();
        var full  = parts.slice(0, 5).join(',').trim();
        var addrEl = document.getElementById('sidebarAddress');
        if (addrEl) addrEl.textContent = short;
        if (_userMarker) {
            _userMarker.setPopupContent(
                '<div style="min-width:190px;font-family:inherit;">' +
                '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
                '<div style="width:28px;height:28px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                '<i class="fas fa-location-arrow" style="color:#3b82f6;font-size:.75rem;"></i></div>' +
                '<strong style="font-size:.92rem;color:#0f172a;">You are here</strong></div>' +
                '<div style="font-size:.8rem;color:#334155;line-height:1.5;margin-bottom:6px;">' + full + '</div>' +
                '<div style="font-size:.72rem;color:#94a3b8;font-family:monospace;">' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '</div></div>'
            );
        }
    }).catch(function(){
        if (_userMarker) _userMarker.setPopupContent('<b>📍 You are here</b><br><span style="font-size:.75rem;color:#64748b;font-family:monospace;">' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '</span>');
    });
}

function centreOnMe() {
    if (_userLat && _userLng) { map.setView([_userLat, _userLng], 14); if (_userMarker) _userMarker.openPopup(); }
    else {
        navigator.geolocation.getCurrentPosition(function(pos){
            _userLat = pos.coords.latitude; _userLng = pos.coords.longitude;
            map.setView([_userLat, _userLng], 14);
            placeUserMarker(_userLat, _userLng);
            updateSidebarLocation(_userLat, _userLng);
        }, function(){ alert('Could not get your location. Please enable GPS.'); });
    }
}

function drawRouteTo(ngoLat, ngoLng, ngoName) {
    if (!_userLat || !_userLng) { alert('Your location not yet available. Allow GPS and try again.'); return; }
    clearRoute();
    _straightLine = L.polyline([[_userLat, _userLng], [ngoLat, ngoLng]], { color:'#f97316', weight:2, dashArray:'6,8', opacity:0.7 }).addTo(map);
    var url = 'https://router.project-osrm.org/route/v1/driving/' + _userLng + ',' + _userLat + ';' + ngoLng + ',' + ngoLat + '?overview=full&geometries=geojson';
    fetch(url).then(function(r){ return r.json(); })
    .then(function(data){
        if (data.routes && data.routes[0]) {
            var route = data.routes[0];
            if (_straightLine) { map.removeLayer(_straightLine); _straightLine = null; }
            _routeLayer = L.geoJSON(route.geometry, { style:{ color:'#3b82f6', weight:4, opacity:0.85 } }).addTo(map);
            map.fitBounds(_routeLayer.getBounds(), { padding:[40,40] });
            var dist = (route.distance / 1000).toFixed(1) + ' km';
            var dur  = Math.round(route.duration / 60) + ' min';
            document.getElementById('routeNGOName').textContent  = ngoName;
            document.getElementById('routeDistance').textContent = dist;
            document.getElementById('routeDuration').textContent = dur;
            document.getElementById('routeInfoPanel').style.display = 'block';
        }
    }).catch(function(){
        map.fitBounds([[_userLat, _userLng], [ngoLat, ngoLng]], { padding:[60,60] });
        document.getElementById('routeNGOName').textContent  = ngoName;
        document.getElementById('routeDistance').textContent = '~' + haversineKm(_userLat, _userLng, ngoLat, ngoLng).toFixed(1) + ' km (straight)';
        document.getElementById('routeDuration').textContent = '—';
        document.getElementById('routeInfoPanel').style.display = 'block';
    });
}

function clearRoute() {
    if (_routeLayer)   { map.removeLayer(_routeLayer);   _routeLayer   = null; }
    if (_straightLine) { map.removeLayer(_straightLine); _straightLine = null; }
    var panel = document.getElementById('routeInfoPanel');
    if (panel) panel.style.display = 'none';
}

function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toggleMapLayer() {
    if (!map) return;
    var btn = document.getElementById('mapLayerBtn');
    if (!_usingAlt) {
        if (_currentTileLayer) map.removeLayer(_currentTileLayer);
        _altTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution:'© Esri World Imagery', maxZoom:19 }).addTo(map);
        _currentTileLayer = _altTileLayer; _usingAlt = true;
        if (btn) { btn.innerHTML = '<i class="fas fa-map-marked-alt"></i>'; btn.title = 'Switch to Street map'; }
    } else {
        if (_currentTileLayer) map.removeLayer(_currentTileLayer);
        _currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution:'© CARTO © OpenStreetMap', subdomains:'abcd', maxZoom:20 }).addTo(map);
        _usingAlt = false;
        if (btn) { btn.innerHTML = '<i class="fas fa-map"></i>'; btn.title = 'Switch to Satellite'; }
    }
}

function zoomToIndia() { if (map) map.setView([20.5937, 78.9629], 5); }

function clearMapSearch() {
    searchMarkers.forEach(function(m){ if (map) map.removeLayer(m); }); searchMarkers = [];
    var inp = document.getElementById('mapSearchInput');
    var clr = document.getElementById('mapSearchClear');
    if (inp) inp.value = '';
    if (clr) clr.style.display = 'none';
    var ngoList = document.getElementById('nearbyNGOList');
    if (ngoList) ngoList.innerHTML = '<div class="nearby-ngo-empty"><i class="fas fa-search"></i><p>Search a city or allow<br>location to see nearby NGOs</p></div>';
    document.getElementById('ngoCount') && (document.getElementById('ngoCount').textContent = '—');
    clearRoute();
}

function buildNGOPopup(ngo) {
    var safeName = ngo.name.replace(/'/g,'&apos;').replace(/"/g,'&quot;');
    return '<div style="min-width:210px;font-family:\'Segoe UI\',sans-serif;">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">' +
        '<div style="width:30px;height:30px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fas fa-hands-helping" style="color:#22c55e;font-size:.8rem;"></i></div>' +
        '<strong style="color:#0f172a;font-size:.9rem;line-height:1.2;">' + ngo.name + '</strong></div>' +
        '<div style="font-size:.78rem;color:#475569;margin-bottom:4px;display:flex;gap:5px;align-items:flex-start;">' +
        '<i class="fas fa-map-marker-alt" style="color:#f97316;margin-top:2px;flex-shrink:0;"></i>' + ngo.address + '</div>' +
        (ngo.phone ? '<div style="font-size:.78rem;color:#475569;margin-bottom:4px;display:flex;gap:5px;align-items:center;">' +
        '<i class="fas fa-phone-alt" style="color:#3b82f6;flex-shrink:0;"></i>' +
        '<a href="tel:' + ngo.phone + '" style="color:#3b82f6;text-decoration:none;font-weight:600;">' + ngo.phone + '</a></div>' : '') +
        (ngo.email ? '<div style="font-size:.78rem;color:#475569;margin-bottom:10px;display:flex;gap:5px;align-items:center;">' +
        '<i class="fas fa-envelope" style="color:#8b5cf6;flex-shrink:0;"></i>' +
        '<a href="mailto:' + ngo.email + '" style="color:#8b5cf6;text-decoration:none;font-weight:600;">' + ngo.email + '</a></div>' : '<div style="margin-bottom:10px;"></div>') +
        '<button onclick="drawRouteTo(' + ngo.lat + ',' + ngo.lng + ',\'' + ngo.name.replace(/'/g,'\\\'') + '\')" ' +
        'style="width:100%;padding:8px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i class="fas fa-route"></i> Directions from My Location</button></div>';
}

function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    _currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd', maxZoom: 20
    }).addTo(map);
    mapInitialized = true;
    var greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41]
    });
    manualNGOs.forEach(function(ngo){
        var mk = L.marker([ngo.lat, ngo.lng], { icon: greenIcon }).addTo(map);
        mk.bindPopup(buildNGOPopup(ngo));
    });
    startLiveLocation();
    updateNearbyNGOList();
}

function updateNearbyNGOList() {
    var listEl  = document.getElementById('nearbyNGOList');
    var countEl = document.getElementById('ngoCount');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (countEl) countEl.textContent = manualNGOs.length;
    manualNGOs.forEach(function(ngo){
        var dist = (_userLat && _userLng) ? haversineKm(_userLat, _userLng, ngo.lat, ngo.lng).toFixed(1) + ' km' : '—';
        var item = document.createElement('div');
        item.className = 'ngo-list-item';
        item.innerHTML = '<div class="ngo-list-icon"><i class="fas fa-hands-helping"></i></div>' +
            '<div class="ngo-list-info"><div class="ngo-list-name">' + ngo.name + '</div>' +
            '<div class="ngo-list-city"><i class="fas fa-map-marker-alt"></i> ' + ngo.city + ' &nbsp;·&nbsp; ' + dist + '</div></div>' +
            '<button class="ngo-list-route-btn" title="Get Directions" onclick="map.setView([' + ngo.lat + ',' + ngo.lng + '],15);setTimeout(function(){drawRouteTo(' + ngo.lat + ',' + ngo.lng + ',\'' + ngo.name.replace(/'/g,'') + '\')},200)"><i class="fas fa-route"></i></button>';
        listEl.appendChild(item);
    });
}

// Show clear button when user types in search
document.addEventListener('DOMContentLoaded', function() {
    var inp = document.getElementById('mapSearchInput');
    var clr = document.getElementById('mapSearchClear');
    if (inp && clr) {
        inp.addEventListener('input', function(){
            clr.style.display = inp.value.length > 0 ? 'flex' : 'none';
        });
    }
});

// ════════════════════════════════════════════════════
// app.py ALSO NEEDS these two updates — reminder:
// 1. Store photo as: "photo_path": f"/uploads/photos/{filename}"
// 2. Serve with:     send_from_directory(UPLOAD_FOLDER, filename)
// 3. Add fields to /submit:  family_aadhaar, person_aadhaar, contact_email
// ════════════════════════════════════════════════════