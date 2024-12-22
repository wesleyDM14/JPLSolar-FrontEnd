import { useDraggable, useDroppable } from "@dnd-kit/core"
import { useState } from "react";

export const Droppable = ({ id, children }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} style={{ background: "#f0f0f0" }}>
            {children}
        </div>
    )
}

export const Draggable = ({ id, children, onClick }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const [isDragging, setIsDragging] = useState(false);

    const style = {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        cursor: "grab",
    };

    const handleMouseDown = () => {
        setIsDragging(false);  // Reseta o estado ao clicar no item
    };

    const handleMouseUp = (event) => {
        if (!isDragging && onClick) {
            onClick(event);  // Abre o modal apenas se o item não foi arrastado
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleMouseUp}  // Garante que o modal seja aberto
        >
            {children}
        </div>
    );
}