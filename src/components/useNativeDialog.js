import { useRef, useEffect } from 'react';
export default function useNativeDialog() {
 const ref = useRef(null);
 useEffect(() => {const previous = document.activeElement;ref.current?.showModal();return () => previous?.focus();}, []);
 return ref;
}
