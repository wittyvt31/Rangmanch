import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
  directorName: string;
  filmName: string;
  role: string;
  inviteUrl: string;
}

export function InviteEmail({
  directorName,
  filmName,
  role,
  inviteUrl,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>You have been credited in {filmName}</Text>
            <Text style={text}>
              Director <strong>{directorName}</strong> tagged you as{" "}
              <strong>{role}</strong> in their film.
            </Text>
            <Text style={text}>
              Claim your profile on RangManch and showcase your work.
            </Text>
            <Button style={button} href={inviteUrl}>
              Claim Your Profile
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              RangManch - The Republic of Cinema
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#171717",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const section = {
  padding: "0 48px",
};

const heading = {
  color: "#e5e5e5",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 16px",
  fontFamily: '"Playfair Display", serif',
};

const text = {
  color: "#e5e5e5",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const button = {
  backgroundColor: "#C5A059",
  borderRadius: "0",
  color: "#0a0a0a",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "24px 0",
};

const hr = {
  borderColor: "#333333",
  margin: "32px 0",
};

const footer = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

