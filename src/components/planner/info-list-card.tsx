import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GuidanceItem } from '@/services/trip-intelligence-service';

interface InfoListCardProps {
  title: string;
  caption: string;
  items: GuidanceItem[];
  variant?: 'default' | 'accent' | 'secondary' | 'dark';
}

export function InfoListCard({
  title,
  caption,
  items,
  variant = 'default',
}: InfoListCardProps) {
  const theme = useAppTheme();

  return (
    <SectionCard variant={variant}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{caption}</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[styles.row, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={[styles.iconBubble, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name={item.icon} size={18} color={theme.colors.text} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[styles.rowDetail, { color: theme.colors.textMuted }]}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    marginTop: 4,
    marginBottom: 14,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    gap: 10,
  },
  row: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  rowDetail: {
    marginTop: 3,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
});
