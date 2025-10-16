import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatRelative = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  }

  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatTimestamp = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
};
