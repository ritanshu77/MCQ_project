"use client";

import SetQuestionsView from "@/components/SetQuestionsView";
import { useParams } from "next/navigation";

export default function SetQuestionsPage() {
    const params = useParams();
    const unitId = params.unitId as string;
    const setId = params.setId as string;

    return (
        <SetQuestionsView 
            setId={setId} 
            unitId={unitId} 
        />
    );
}
