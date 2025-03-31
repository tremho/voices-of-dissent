import React, { useState } from "react";
import { Container, Typography, Paper, Checkbox, FormControlLabel, Button } from "@mui/material";

export function SubmissionGuidelines({ onProceed, active }) {
    const [acknowledged, setAcknowledged] = useState(false);

    if(active && !acknowledged) {
        return (
            <Container maxWidth="md" sx={{mt: 4}}>
                <Paper elevation={3} sx={{p: 4, textAlign: "center"}}>
                    <Typography variant="h4" gutterBottom>
                        Submission Guidelines
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Before submitting your content, please ensure that it adheres to the following guidelines:
                    </Typography>
                    <ul style={{textAlign: "left"}}>
                        <li>Content must not infringe on any copyrights.</li>
                        <li>No directly offensive, harmful, or illegal material is allowed.</li>
                        <li>Ensure proper formatting and clear descriptions.</li>
                        <li>By submitting, you grant permission for content review.</li>
                        <li>By submitting, you grant permission for (non-exclusive) public distribution via this service.</li>
                    </ul>
                    <FormControlLabel
                        control={<Checkbox checked={acknowledged} onChange={() => setAcknowledged(!acknowledged)}/>}
                        label="I have read and agree to the submission guidelines"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!acknowledged}
                        onClick={onProceed}
                        sx={{mt: 2}}
                    >
                        Proceed to Submission
                    </Button>
                </Paper>
            </Container>
        );
    }
}