import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/system';


const HelpItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const HelpText = styled(Typography)({
  fontSize: '0.875rem',
  lineHeight: 1.2,
});

const helpItems = [
  {
    number: '1',
    description: 'Vyberte si pomocí tlačítka, jaké měření chcete provést.'
  },
  {
    number: '2',
    description: 'Výběrem dvou bodů v mapě kliknutím na ně změříte vzdálenost mezi nimi a zjistíte azimut.'
  },
  {
    number: '3',
    description: 'Kliknutím na existující bod a jeho přetažením můžete upravit jeho polohu a přepočítat měření.'
  },
  
  // Zde přidat další položky nápovědy
];

const HelpComponent: React.FC = () => {
  return (
    <Box sx={{ width: '40%',float: 'right '}}>
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Měření pomocí kreslení do mapy
      </Typography>
        {helpItems.map((item, index) => (
          <HelpItem key={index}>
              <HelpText variant="body1">{item.number}</HelpText>
              <HelpText variant="body2">{item.description}</HelpText>
            </HelpItem>
        ))}
    </Paper>
    </Box>
  );
};

export default HelpComponent;