import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { QrPass } from '@/types/domain';

interface QrPassGridProps {
  passes: QrPass[];
}

export function QrPassGrid({ passes }: QrPassGridProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.grid}>
      {passes.map((pass, index) => (
        <SectionCard key={pass.id} variant={index % 2 === 0 ? 'accent' : 'secondary'} style={styles.card}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{pass.label}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{pass.subtitle}</Text>
          <PseudoQr payload={pass.payload} />
        </SectionCard>
      ))}
    </View>
  );
}

function PseudoQr({ payload }: { payload: string }) {
  const blocks = useMemo(() => {
    const length = 15 * 15;
    return Array.from({ length }, (_, index) => {
      const char = payload.charCodeAt(index % payload.length);
      return (char + index * 11) % 3 === 0;
    });
  }, [payload]);

  return (
    <View style={styles.qr}>
      {blocks.map((active, index) => (
        <View
          key={`${payload}-${index}`}
          style={[
            styles.qrCell,
            {
              backgroundColor: active ? '#171717' : 'transparent',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  qr: {
    marginTop: 6,
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    overflow: 'hidden',
  },
  qrCell: {
    width: '6.666%',
    aspectRatio: 1,
  },
});
