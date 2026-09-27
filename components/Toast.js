import { useStore } from '../context/StoreContext';

export default function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return <div className="toast">{toastMsg}</div>;
}
