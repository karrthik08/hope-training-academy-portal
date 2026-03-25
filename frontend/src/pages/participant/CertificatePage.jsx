import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Certificate() {
  const { enrollmentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enrollmentId) return;
    const token = localStorage.getItem("hope_access_token") || "";
    fetch(`/api/v1/enrollments/${enrollmentId}/certificate`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => setData(d))
    .catch(e => setError(e.message));
  }, [enrollmentId]);

  if (error) return <div style={{padding:"40px",color:"red",textAlign:"center"}}>{error}</div>;
  if (!data)  return <div style={{padding:"40px",textAlign:"center",color:"#888"}}>Loading certificate...</div>;

  const d = new Date(data.completed_at);
  const fullDate = d.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month:"long" });
  const year = d.getFullYear();
  const expDate = new Date(d); expDate.setFullYear(expDate.getFullYear() + 3);
  const expStr = expDate.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });

  const template = data.certificate_template || "OOH";
  const imgSrc =
    template === "PPW"       ? "/certificates/ppw-certificate.png" :
    template === "CORPORATE" ? "/certificates/corporate-certificate.png" :
                               "/certificates/ooh-certificate.png";

  return (
    <div style={{
      padding:"30px 20px", display:"flex", flexDirection:"column",
      alignItems:"center", gap:"20px", background:"#f8fafc", minHeight:"100vh"
    }}>
      <div style={{display:"flex", gap:"12px"}}>
        <button onClick={() => window.print()}
          style={{background:"#2563eb",color:"white",padding:"10px 24px",
            borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"15px",fontWeight:"600"}}>
           Print / Save PDF
        </button>
      </div>

      <div id="cert-container" style={{
        position:"relative", display:"inline-block",
        maxWidth:"1000px", width:"100%"
      }}>
        <img src={imgSrc} alt="Certificate" style={{width:"100%", display:"block"}} />

        {/* ── OOH OVERLAYS ── */}
        {template === "OOH" && <>
          {/* Name — below "Proudly Presented to" */}
          <div style={{
            position:"absolute", top:"39%", left:"25%", right:"5%",
            textAlign:"center", fontSize:"2.3vw", fontWeight:"bold",
            fontStyle:"italic", color:"#1a1a2e",
          }}>
            {data.participant_name}
          </div>

          {/* Date — on the "On" line */}
          <div style={{
            position:"absolute", top:"60.5%", left:"48%",
            fontSize:"1.3vw", color:"#333", fontWeight:"bold",
          }}>
            {fullDate}
          </div>

          {/* Hours — fills "( )" */}
          <div style={{
            position:"absolute", top:"61.5%", left:"33.5%",
            fontSize:"0.9vw", color:"#333", fontStyle:"italic",
          }}>
            {data.hours || "N/A"}
          </div>

          {/* Course — after "hours of", before "for the State of Maryland" */}
          <div style={{
            position:"absolute", top:"52.5%", left:"50%", right:"30%",
            fontSize:"0.9vw", color:"#333", fontStyle:"italic", fontWeight:"bold",
            lineHeight:1.25,
          }}>
            {data.training_title}
          </div>

          {/* Cert ID */}
          <div style={{
            position:"absolute", bottom:"4.5%", left:"4%",
            fontSize:"0.8vw", color:"#555",
          }}>
            Cert ID: {data.certificate_id}
          </div>
        </>}

        {/* ── PPW OVERLAYS ── */}
        {template === "PPW" && <>
          {/* Name */}
          <div style={{
            position:"absolute", top:"39%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"3vw", fontWeight:"bold",
            fontStyle:"italic", color:"#2c5a1e",
          }}>
            {data.participant_name}
          </div>

          {/* Course title */}
          <div style={{
            position:"absolute", top:"55%", left:"12%", right:"12%",
            textAlign:"center", fontSize:"1.5vw", fontWeight:"bold",
            fontStyle:"italic", color:"#2c5a1e", lineHeight:1.3,
          }}>
            {data.training_title}
          </div>

          {/* CEU + dates — replaces the "-Hour CEU: 3-Year Certification From: Date" line */}
          <div style={{
            position:"absolute", top:"62.5%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"1.15vw", color:"#8B6914", fontWeight:"bold",
          }}>
            Hour CEU: 3-Year Certification From: {fullDate} To: {expStr}
          </div>

          {/* Cert ID */}
          <div style={{
            position:"absolute", bottom:"13.5%", left:"50%", transform:"translateX(-50%)",
            fontSize:"0.75vw", color:"#aaa", whiteSpace:"nowrap",
          }}>
            Certificate ID: {data.certificate_id}
          </div>
        </>}

        {/* ── CORPORATE OVERLAYS ── */}
        {template === "CORPORATE" && <>
          {/* Name — between title and "Has mastered" */}
          <div style={{
            position:"absolute", top:"30%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"2.8vw", fontWeight:"bold",
            fontStyle:"italic", color:"#1a1a1a",
          }}>
            {data.participant_name}
          </div>

          {/* Course title — below "Has mastered the course" */}
          <div style={{
            position:"absolute", top:"52%", left:"15%", right:"15%",
            textAlign:"center", fontSize:"1.6vw", fontWeight:"bold",
            color:"#2c5a1e", lineHeight:1.3,
          }}>
            {data.training_title}
          </div>

          {/* Day number — on the blank after "Awarded this" */}
          <div style={{
            position:"absolute", top:"62%", left:"42.5%",
            fontSize:"1.3vw", color:"#333", fontWeight:"bold",
          }}>
            {day}
          </div>

          {/* Month — on the blank after "day of" */}
          <div style={{
            position:"absolute", top:"62%", left:"56%",
            fontSize:"1.3vw", color:"#333", fontWeight:"bold",
          }}>
            {month}
          </div>

          {/* Year — after "20" */}
          <div style={{
            position:"absolute", top:"62%", left:"68%",
            fontSize:"1.3vw", color:"#333", fontWeight:"bold",
          }}>
            {year}
          </div>

          {/* Cert ID */}
          <div style={{
            position:"absolute", bottom:"5.5%", left:"50%", transform:"translateX(-50%)",
            fontSize:"0.75vw", color:"#aaa", whiteSpace:"nowrap",
          }}>
            Certificate ID: {data.certificate_id}
          </div>
        </>}
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