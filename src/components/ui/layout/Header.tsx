import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const Header: React.FC = () => {
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        VRG Demo
      </Typography>
    </Box>
  );
}

export default Header;