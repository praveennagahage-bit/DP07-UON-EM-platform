import { useParams } from 'react-router-dom';
import EventEditor from '../components/EventEditor';
export default function EditEvent() {
  const { id } = useParams();
  return <EventEditor key={id} editing />;
}
