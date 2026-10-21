const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number)

    return hours * 60 + minutes
}

const getSlotOverlapMinutes = (learnerSlot,teacherSlot) => {

    if(learnerSlot.day !== teacherSlot.day){
        return 0
    }

    const learnerStart = timeToMinutes(learnerSlot.startTime)
    const learnerEnd = timeToMinutes(learnerSlot.endTime)

    const teacherStart = timeToMinutes(teacherSlot.startTime)
    const teacherEnd = timeToMinutes(teacherSlot.endTime)

    const overlapStart = Math.max( learnerStart , teacherStart)

    const overlapEnd = Math.min( learnerEnd , teacherEnd )

    return Math.max( 0 , overlapEnd - overlapStart )
}


const getTotalOverlapMinutes = ( learnerAvailability , teacherAvailability) => {

    let totalOverlap = 0

    for(const learnerSlot of learnerAvailability){

        for(const teacherSlot of teacherAvailability){

            totalOverlap += getSlotOverlapMinutes( learnerSlot , teacherSlot )
        }
    }

    return totalOverlap
}


const getAvailabilityScore = (overlapMinutes) => {

    if(overlapMinutes >= 180) return 100
    if(overlapMinutes >= 120) return 60
    if(overlapMinutes >= 60) return 30
    if(overlapMinutes > 0) return 10

    return 0
}


const getRatingScore = (rating) => {

    return (rating / 5) * 100
}


const getReviewScore = (totalReviews) => {

    if(totalReviews >= 51) return 100
    if(totalReviews >= 26) return 80
    if(totalReviews >= 11) return 60
    if(totalReviews >= 4) return 40
    if(totalReviews >= 1) return 20

    return 0
}

const getExperienceScore = (completedSkillSessions) => {

    if(completedSkillSessions >= 21) return 100
    if(completedSkillSessions >= 11) return 80
    if(completedSkillSessions >= 6) return 60
    if(completedSkillSessions >= 3) return 40
    if(completedSkillSessions >= 1) return 20

    return 0
}


export {
    timeToMinutes,
    getSlotOverlapMinutes,
    getTotalOverlapMinutes,
    getAvailabilityScore,
    getRatingScore,
    getReviewScore,
    getExperienceScore
}