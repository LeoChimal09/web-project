"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

type ReservationForm = {
  fullName: string;
  email: string;
  reservationDate: string;
  reservationTime: string;
  guests: string;
};

const initialForm: ReservationForm = {
  fullName: "",
  email: "",
  reservationDate: "",
  reservationTime: "18:00",
  guests: "2",
};

const times = ["17:00", "18:00", "19:00", "20:00", "21:00"];

export default function ReservationPage() {
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const isValid = useMemo(() => {
    return Boolean(form.fullName && form.email && form.reservationDate && form.reservationTime && form.guests);
  }, [form]);

  const onChange = (field: keyof ReservationForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitted(false);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="overline" color="secondary.main">
          Reservation
        </Typography>
        <Typography variant="h3">Reserve your table</Typography>
        <Typography color="text.secondary">
          This page mirrors the reference reservation flow and will be wired to real availability checks in the next iteration.
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                value={form.fullName}
                onChange={(event) => onChange("fullName")(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => onChange("email")(event.target.value)}
                required
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Date"
                  type="date"
                  value={form.reservationDate}
                  onChange={(event) => onChange("reservationDate")(event.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Time"
                  select
                  value={form.reservationTime}
                  onChange={(event) => onChange("reservationTime")(event.target.value)}
                  required
                  fullWidth
                >
                  {times.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Guests"
                  select
                  value={form.guests}
                  onChange={(event) => onChange("guests")(event.target.value)}
                  required
                  fullWidth
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <MenuItem key={count} value={String(count)}>
                      {count}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Button type="submit" variant="contained" size="large" disabled={!isValid}>
                Check Availability
              </Button>

              {submitted && (
                <Alert severity="success">
                  Table request received for {form.fullName} on {form.reservationDate} at {form.reservationTime}. Next step is wiring this to database-backed availability.
                </Alert>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
