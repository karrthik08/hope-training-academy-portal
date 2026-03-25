/**
 * CertificateTemplates.jsx
 *
 * Three certificate templates matching the PDFs provided by Dr. Patrecia Williams:
 *   - PPWCertificate      → Prevention Plus Wellness (green border, PPW logo, 3-year CEU)
 *   - OOHCertificate      → Organization of Hope (colorful geometric, State of Maryland)
 *   - CorporateCertificate → Corporate Training Materials (simple green ornate border)
 *
 * Usage in /certificate/:enrollment_id page:
 *
 *   const template = training.certificate_template; // 'PPW' | 'OOH' | 'CORPORATE'
 *
 *   {template === 'PPW'       && <PPWCertificate {...props} />}
 *   {template === 'OOH'       && <OOHCertificate {...props} />}
 *   {template === 'CORPORATE' && <CorporateCertificate {...props} />}
 */

import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper — formats date as "January 15, 2025"
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PPW Certificate
//    Matches: PPW_Certificate_Template.pdf
//    Green ornate border, PPW watermark logo, 3-year certification, Dr. Williams sig
// ─────────────────────────────────────────────────────────────────────────────
export function PPWCertificate({ participantName, trainingTitle, completedAt, certificateId, hours }) {
  const completionDate = formatDate(completedAt);
  const expirationDate = new Date(completedAt);
  expirationDate.setFullYear(expirationDate.getFullYear() + 3);
  const expiration = formatDate(expirationDate.toISOString());

  return (
    <div
      id="certificate-content"
      style={{
        width: "1056px",
        height: "816px",
        position: "relative",
        background: "#ffffff",
        fontFamily: "Georgia, 'Times New Roman', serif",
        overflow: "hidden",
      }}
    >
      {/* Outer green ornate border */}
      <div
        style={{
          position: "absolute",
          inset: "10px",
          border: "18px solid #7a9e6e",
          borderImage: "none",
          boxShadow: "inset 0 0 0 4px #7a9e6e, inset 0 0 0 8px #ffffff, inset 0 0 0 10px #7a9e6e",
        }}
      />

      {/* Inner white content area */}
      <div
        style={{
          position: "absolute",
          inset: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "30px 60px",
        }}
      >
        {/* PPW Watermark Logo (circle with figures) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "320px",
            height: "320px",
            opacity: 0.08,
            borderRadius: "50%",
            background: "radial-gradient(circle, #e87a7a 0%, #7ab8e8 60%)",
          }}
        />

        {/* Header */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#8B6914",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Prevention Plus Wellness, LLC
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              color: "#8B6914",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Certification
          </div>
        </div>

        {/* Awarded To */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "18px", color: "#4a7a3e", marginBottom: "8px" }}>
            Awarded to
          </div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: "bold",
              color: "#2c5a1e",
              fontStyle: "italic",
              marginBottom: "16px",
              borderBottom: "2px solid #7a9e6e",
              paddingBottom: "8px",
            }}
          >
            {participantName}
          </div>
          <div style={{ fontSize: "16px", color: "#555", marginBottom: "8px" }}>
            For successfully completing the workshop
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#2c5a1e",
              fontStyle: "italic",
            }}
          >
            {trainingTitle}
          </div>
        </div>

        {/* CEU / Certification block */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "15px", color: "#8B6914", marginBottom: "6px" }}>
            <strong>{hours}-Hour CEU &nbsp;|&nbsp; 3-Year Certification</strong>
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <strong>From:</strong> {completionDate} &nbsp;&nbsp; <strong>To:</strong> {expiration}
          </div>
        </div>

        {/* Footer — Provided by + signature line */}
        <div
          style={{
            width: "100%",
            borderTop: "1px solid #7a9e6e",
            paddingTop: "16px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>Provided By:</div>
          <div
            style={{
              fontSize: "16px",
              fontStyle: "italic",
              fontWeight: "bold",
              color: "#8B6914",
              fontFamily: "'Brush Script MT', cursive, Georgia",
            }}
          >
            Dr. Patrecia Williams, Founder/Executive Director,
          </div>
          <div
            style={{
              fontSize: "16px",
              fontStyle: "italic",
              fontWeight: "bold",
              color: "#8B6914",
              fontFamily: "'Brush Script MT', cursive, Georgia",
            }}
          >
            Bridging Hope, Inc dba Organization Of Hope
          </div>
          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "10px" }}>
            Certificate ID: {certificateId}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OOH Certificate
//    Matches: OOH_Certificate_Template.pdf
//    Bold colorful geometric design, "Certificate of Training", State of Maryland,
//    OOH seal, Patrecia Williams full signature block
// ─────────────────────────────────────────────────────────────────────────────
export function OOHCertificate({ participantName, trainingTitle, completedAt, certificateId, hours }) {
  const completionDate = formatDate(completedAt);

  return (
    <div
      id="certificate-content"
      style={{
        width: "1056px",
        height: "816px",
        position: "relative",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top-left colorful geometric decoration */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "280px", height: "280px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "180px", height: "220px", background: "#E8174B", transform: "skewX(-5deg)", opacity: 0.9 }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "120px", height: "160px", background: "#F5A623", transform: "skewX(-5deg)" }} />
        <div style={{ position: "absolute", top: 0, left: "150px", width: "60px", height: "120px", background: "#E8174B", opacity: 0.6 }} />
        <div style={{ position: "absolute", top: "60px", left: "-10px", width: "100px", height: "6px", background: "rgba(255,255,255,0.5)", transform: "rotate(-15deg)" }} />
        <div style={{ position: "absolute", top: "90px", left: "-10px", width: "160px", height: "6px", background: "rgba(255,255,255,0.4)", transform: "rotate(-15deg)" }} />
        <div style={{ position: "absolute", top: "120px", left: "-10px", width: "220px", height: "6px", background: "rgba(255,255,255,0.3)", transform: "rotate(-15deg)" }} />
      </div>

      {/* Bottom-right colorful geometric decoration */}
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "280px", height: "280px" }}>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "180px", height: "220px", background: "#00B4D8", transform: "skewX(-5deg)", opacity: 0.9 }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "120px", height: "160px", background: "#E8174B", transform: "skewX(-5deg)" }} />
        <div style={{ position: "absolute", bottom: "60px", right: "-10px", width: "100px", height: "6px", background: "rgba(255,255,255,0.5)", transform: "rotate(-15deg)" }} />
        <div style={{ position: "absolute", bottom: "90px", right: "-10px", width: "160px", height: "6px", background: "rgba(255,255,255,0.4)", transform: "rotate(-15deg)" }} />
      </div>

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "220px",
          right: "220px",
          bottom: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: "900",
              color: "#1a1a2e",
              lineHeight: 1.1,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Certificate of
          </div>
          <div
            style={{
              fontSize: "60px",
              fontWeight: "900",
              color: "#1a1a2e",
              lineHeight: 1,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Training
          </div>
        </div>

        {/* Proudly Presented To */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <div
            style={{
              fontSize: "18px",
              fontStyle: "italic",
              color: "#444",
              marginBottom: "12px",
            }}
          >
            Proudly Presented to
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#1a1a2e",
              fontStyle: "italic",
              marginBottom: "20px",
            }}
          >
            {participantName}
          </div>

          {/* On / has completed */}
          <div style={{ fontSize: "15px", color: "#555", marginBottom: "8px" }}>
            <span style={{ fontStyle: "italic" }}>On</span>{" "}
            <strong>{completionDate}</strong>
          </div>
          <div
            style={{
              fontSize: "15px",
              color: "#555",
              fontStyle: "italic",
              marginBottom: "4px",
            }}
          >
            <em>has completed</em>{" "}
            <strong>({hours}) hours</strong>{" "}
            <em>of</em>{" "}
            <strong>{trainingTitle}</strong>{" "}
            <em>for the State of Maryland</em>
          </div>
        </div>

        {/* Bottom block — logo + signature */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Org info */}
          <div style={{ fontSize: "12px", color: "#333", lineHeight: 1.7 }}>
            <div style={{ fontWeight: "bold" }}>Bridging Hope, Inc. 501(c)(3)</div>
            <div>Organization of Hope, Inc.</div>
            <div>Organization Provider Number: R-65407</div>
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#888" }}>
              Cert ID: {certificateId}
            </div>
          </div>

          {/* Center: OOH Seal placeholder */}
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "3px solid #7a9e6e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              textAlign: "center",
              color: "#2c5a1e",
              fontWeight: "bold",
              padding: "8px",
              lineHeight: 1.3,
            }}
          >
            ORGANIZATION<br />OF HOPE<br />⭐
          </div>

          {/* Right: Signature block */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Brush Script MT', cursive, Georgia",
                fontSize: "26px",
                color: "#1a1a2e",
                marginBottom: "4px",
              }}
            >
              Patrecia Williams
            </div>
            <div
              style={{
                borderTop: "2px solid #1a1a2e",
                paddingTop: "6px",
                fontSize: "12px",
                color: "#333",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: "bold" }}>Patrecia Williams</div>
              <div>PhD, PMP, CBM, QMS, CNE, CNC, RCP, RSP</div>
              <div>Founder/Executive Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Corporate Certificate
//    Matches: Corporate_Training_Material_Certificate_Template.pdf
//    Simple green ornate border, "Certificate of Completion", "Has mastered the course"
// ─────────────────────────────────────────────────────────────────────────────
export function CorporateCertificate({ participantName, trainingTitle, completedAt, certificateId }) {
  const d = new Date(completedAt);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const year = d.getFullYear();

  return (
    <div
      id="certificate-content"
      style={{
        width: "1056px",
        height: "816px",
        position: "relative",
        background: "#ffffff",
        fontFamily: "Georgia, 'Times New Roman', serif",
        overflow: "hidden",
      }}
    >
      {/* Outer border */}
      <div
        style={{
          position: "absolute",
          inset: "8px",
          border: "3px solid #1a1a1a",
        }}
      />

      {/* Green ornate border */}
      <div
        style={{
          position: "absolute",
          inset: "18px",
          border: "20px solid #7a9e6e",
          boxShadow: "inset 0 0 0 4px #ffffff, inset 0 0 0 6px #7a9e6e",
          background: "transparent",
        }}
      >
        {/* Corner decorations */}
        {[
          { top: "-2px", left: "-2px" },
          { top: "-2px", right: "-2px" },
          { bottom: "-2px", left: "-2px" },
          { bottom: "-2px", right: "-2px" },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "60px",
              height: "60px",
              ...pos,
              background: "#7a9e6e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "#ffffff",
            }}
          >
            ❧
          </div>
        ))}

        {/* Top center decoration */}
        <div
          style={{
            position: "absolute",
            top: "-2px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#7a9e6e",
            padding: "4px 20px",
            fontSize: "22px",
            color: "#ffffff",
          }}
        >
          ❧❧
        </div>

        {/* Bottom center decoration */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#7a9e6e",
            padding: "4px 20px",
            fontSize: "22px",
            color: "#ffffff",
          }}
        >
          ❧❧
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: "70px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 60px",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "38px",
              fontStyle: "italic",
              color: "#8B6914",
              letterSpacing: "3px",
            }}
          >
            Certificate of Completion
          </div>
        </div>

        {/* Recipient */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1a1a1a",
              fontStyle: "italic",
              marginBottom: "16px",
            }}
          >
            {participantName}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontStyle: "italic",
              color: "#333",
              marginBottom: "12px",
            }}
          >
            Has mastered the course
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#2c5a1e",
            }}
          >
            {trainingTitle}
          </div>
        </div>

        {/* Date + Signature line */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "40px",
            }}
          >
            Awarded this{" "}
            <span style={{ borderBottom: "1px solid #333", padding: "0 8px" }}>{day}</span>{" "}
            day of{" "}
            <span style={{ borderBottom: "1px solid #333", padding: "0 8px" }}>{month}</span>
            , {year}
          </div>

          {/* Signature line */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "60px" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Brush Script MT', cursive, Georgia",
                  fontSize: "28px",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                Patrecia Williams
              </div>
              <div style={{ borderTop: "1px solid #333", width: "280px", marginBottom: "4px" }} />
              <div style={{ fontSize: "13px", color: "#555" }}>
                Dr. Patrecia Williams, Founder/Executive Director
              </div>
              <div style={{ fontSize: "12px", color: "#777" }}>
                Bridging Hope, Inc. dba Organization of Hope
              </div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "16px" }}>
            Certificate ID: {certificateId}
          </div>
        </div>
      </div>
    </div>
  );
}