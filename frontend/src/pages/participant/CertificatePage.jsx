import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function CertificatePage() {
  const { enrollmentId } = useParams();
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enrollmentId) return;
    const token = localStorage.getItem("hope_access_token") || "";
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
    
    fetch(`${API_BASE}/api/v1/enrollments/${enrollmentId}/certificate`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(d => setData(d))
    .catch(e => setError(e.message));
  }, [enrollmentId]);

  if (error) return (
    <div style={{ padding:"40px", color:"red", textAlign:"center" }}>
      Error: {error}
      <br />
      <Link to="/dashboard" style={{ color:"#2563eb", marginTop:"12px", display:"inline-block" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );

  if (!data) return (
    <div style={{ padding:"40px", textAlign:"center", color:"#888" }}>
      Loading certificate...
    </div>
  );

  const d        = new Date(data.completed_at);
  const fullDate = d.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const day      = d.getDate();
  const month    = d.toLocaleDateString("en-US", { month:"long" });
  const year     = d.getFullYear();
  const expDate  = new Date(d);
  expDate.setFullYear(expDate.getFullYear() + 3);
  const expStr   = expDate.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });

  const template = (data.certificate_template || "OOH").toUpperCase();
  const imgSrc =
    template === "PPW" ? "/certificates/ppw-certificate.png" :
                         "/certificates/ooh-certificate.png";

  return (
    <div style={{
      padding:"30px 20px", display:"flex", flexDirection:"column",
      alignItems:"center", gap:"20px", background:"#f8fafc", minHeight:"100vh"
    }}>
      <div style={{ display:"flex", gap:"12px", alignSelf:"flex-start", marginLeft:"20px" }}>
        <Link to="/dashboard" style={{
          background:"#e5e7eb", color:"#374151", padding:"10px 20px",
          borderRadius:"8px", textDecoration:"none", fontSize:"14px", fontWeight:"600"
        }}>
          ← Back to Dashboard
        </Link>
        <button onClick={() => window.print()} style={{
          background:"#2563eb", color:"white", padding:"10px 24px",
          borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"15px", fontWeight:"600"
        }}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <div id="cert-container" style={{
        position:"relative", display:"inline-block",
        maxWidth:"1000px", width:"100%"
      }}>
        <img src={imgSrc} alt="Certificate" style={{ width:"100%", display:"block" }} />

        {/* CORPORATE and OOH templates use the same certificate image */}
        {(template === "OOH" || template === "CORPORATE") && <>
          {/* PARTICIPANT NAME - Below "Proudly Presented to" */}
          <div style={{
            position:"absolute", top:"42%", left:"25%", right:"5%",
            textAlign:"center", fontSize:"2.3vw", fontWeight:"bold",
            fontStyle:"italic", color:"#1a1a2e",
          }}>
            {data.participant_name}
          </div>
          
          {/* TRAINING TITLE - "On" line */}
          <div style={{
            position:"absolute", 
            top:"50.5%", 
            left:"50%", 
            transform:"translateX(-50%)",
            fontSize:"1.4vw", 
            color:"#333", 
            fontStyle:"italic", 
            fontWeight:"bold",
            lineHeight:1.25,
            textAlign:"center",
            width:"50%"
          }}>
            {data.training_title}
          </div>
          
          {/* DURATION HOURS - "( ) hours of" */}
          <div style={{
            position:"absolute", 
            top:"61.5%", 
            left:"33.9%",
            fontSize:"0.9vw", 
            color:"#333", 
            fontStyle:"italic",
          }}>
            {data.duration_hours || "N/A"}
          </div>
          
          {/* COMPLETION DATE */}
          <div style={{
            position:"absolute", 
            top:"60.5%", 
            left:"48%",
            fontSize:"1.3vw", 
            color:"#333", 
            fontWeight:"bold",
          }}>
            {fullDate}
          </div>
          
          {/* CERTIFICATE ID - Bottom left */}
          <div style={{
            position:"absolute", 
            bottom:"4.5%", 
            left:"4%",
            fontSize:"0.8vw", 
            color:"#555",
          }}>
            Cert ID: {data.certificate_id}
          </div>
          
          {/* MABPCB PROVIDER NUMBER - Bottom right */}
          <div style={{
            position:"absolute", 
            bottom:"4.5%", 
            right:"4%",
            fontSize:"0.8vw", 
            color:"#555",
          }}>
            MABPCB Provider #: 24-081-P
          </div>
        </>}

        {template === "PPW" && <>
          {/* PARTICIPANT NAME */}
          <div style={{
            position:"absolute", top:"39%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"3vw", fontWeight:"bold",
            fontStyle:"italic", color:"#2c5a1e",
          }}>
            {data.participant_name}
          </div>
          
          {/* TRAINING TITLE */}
          <div style={{
            position:"absolute", top:"55%", left:"12%", right:"12%",
            textAlign:"center", fontSize:"1.5vw", fontWeight:"bold",
            fontStyle:"italic", color:"#2c5a1e", lineHeight:1.3,
          }}>
            {data.training_title}
          </div>
          
          {/* CERTIFICATION DATES */}
          <div style={{
            position:"absolute", top:"62.5%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"1.15vw", color:"#8B6914", fontWeight:"bold",
          }}>
            Hour CEU: 3-Year Certification From: {fullDate} To: {expStr}
          </div>
          
          {/* CERTIFICATE ID */}
          <div style={{
            position:"absolute", bottom:"13.5%", left:"50%", transform:"translateX(-50%)",
            fontSize:"0.75vw", color:"#aaa", whiteSpace:"nowrap",
          }}>
            Certificate ID: {data.certificate_id}
          </div>
          
          {/* MABPCB PROVIDER NUMBER */}
          <div style={{
            position:"absolute", bottom:"19%", left:"29%", transform:"translateX(-50%)",
            fontSize:"0.8vw", color:"#8B6914", fontWeight:"600", whiteSpace:"nowrap",
          }}>
            Organization Provider Number: R-65407
          </div>
        </>}
      </div>

      <div style={{
        maxWidth:"1000px", width:"100%", background:"white",
        borderRadius:"12px", padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)"
      }} className="print:hidden">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", fontSize:"14px" }}>
          <div><span style={{ color:"#6b7280" }}>Participant:</span> <strong>{data.participant_name}</strong></div>
          <div><span style={{ color:"#6b7280" }}>Training:</span> <strong>{data.training_title}</strong></div>
          <div><span style={{ color:"#6b7280" }}>Completed:</span> <strong>{fullDate}</strong></div>
          <div><span style={{ color:"#6b7280" }}>Certificate ID:</span> <strong style={{ color:"#2563eb", fontFamily:"monospace" }}>{data.certificate_id}</strong></div>
          <div><span style={{ color:"#6b7280" }}>Duration:</span> <strong>{data.duration_hours || "N/A"} hours</strong></div>
          <div><span style={{ color:"#6b7280" }}>Template:</span> <strong>{template}</strong></div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cert-container, #cert-container * { visibility: visible; }
          #cert-container { position: fixed; top: 0; left: 0; width: 100vw; margin: 0; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}